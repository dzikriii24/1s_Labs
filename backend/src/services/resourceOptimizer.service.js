const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { query } = require('../db');
const { resourceService, systemProcessService, execUapi } = require('./cpanel.service');
const { sendMail } = require('./email.service');

// Constants
const MEMORY_LIMIT_BYTES = 1073741824; // 1 GB CloudLinux limit
const CPU_LIMIT_PERCENT = 100;
const EP_LIMIT = 12;
const NPROC_LIMIT = 100;
const IO_LIMIT_BYTES = 1048576; // 1 MB/s
const IOPS_LIMIT = 1024;

// Threshold levels
const THRESHOLDS = {
  NORMAL: { min: 0, max: 69, name: 'level_1_normal', badge: 'optimal' },
  WARNING: { min: 70, max: 79, name: 'level_2_warning', badge: 'warning' },
  HIGH_USAGE: { min: 80, max: 89, name: 'level_3_high', badge: 'high_usage' },
  CRITICAL: { min: 90, max: 94, name: 'level_4_critical', badge: 'critical' },
  EMERGENCY: { min: 95, max: 100, name: 'level_5_emergency', badge: 'emergency' }
};

// Hysteresis step-down thresholds (to prevent oscillation)
const RECOVERY_THRESHOLDS = {
  emergency_to_critical: 92,
  critical_to_high: 85,
  high_to_warning: 75,
  warning_to_normal: 65
};

class ResourceOptimizerService {
  constructor() {
    this.cachedSettings = null;
    this.lastSettingsFetch = 0;
    this.lastEscalationTime = 0;
    this.currentLevel = 'level_1_normal';
    this.inMemoryMetrics = null;
  }

  /**
   * Fetch protection settings from DB with 15s in-memory caching
   */
  async getSettings() {
    const now = Date.now();
    if (this.cachedSettings && now - this.lastSettingsFetch < 15000) {
      return this.cachedSettings;
    }

    try {
      const rows = await query('SELECT setting_key, setting_value FROM resource_protection_settings');
      const settings = {};
      rows.forEach((r) => {
        let val = r.setting_value;
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(Number(val))) val = Number(val);
        settings[r.setting_key] = val;
      });

      this.cachedSettings = {
        auto_optimization_enabled: settings.auto_optimization_enabled ?? true,
        dry_run_mode: settings.dry_run_mode ?? false,
        manual_override: settings.manual_override ?? false,
        hysteresis_seconds: settings.hysteresis_seconds || 180,
        warning_threshold: settings.warning_threshold || 70,
        high_usage_threshold: settings.high_usage_threshold || 80,
        critical_threshold: settings.critical_threshold || 90,
        emergency_threshold: settings.emergency_threshold || 95,
        last_optimization_level: settings.last_optimization_level || 'level_1_normal',
        last_optimization_time: settings.last_optimization_time || new Date().toISOString()
      };
      this.lastSettingsFetch = now;
      this.currentLevel = this.cachedSettings.last_optimization_level;
      return this.cachedSettings;
    } catch (err) {
      console.warn('[ResourceOptimizer] Error fetching settings from DB, using fallback:', err.message);
      return {
        auto_optimization_enabled: true,
        dry_run_mode: false,
        manual_override: false,
        hysteresis_seconds: 180,
        warning_threshold: 70,
        high_usage_threshold: 80,
        critical_threshold: 90,
        emergency_threshold: 95
      };
    }
  }

  /**
   * Update setting in DB
   */
  async updateSetting(key, value) {
    await query(
      `INSERT INTO resource_protection_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, String(value), String(value)]
    );
    this.cachedSettings = null; // bust cache
  }

  /**
   * Collect real-time CloudLinux LVE and system metrics
   */
  async getLiveMetrics() {
    let usages = [];
    let quotaInfo = {};
    let uptimeStr = '';

    try {
      usages = await resourceService.getUsages();
    } catch (e) {
      console.warn('[ResourceOptimizer] getUsages warning:', e.message);
    }

    try {
      quotaInfo = await execUapi('Quota', 'get_quota_info');
    } catch (e) {
      // Non-critical if quota lookup fails
    }

    try {
      uptimeStr = await systemProcessService.getUptime();
    } catch (e) {
      uptimeStr = 'up 1 day';
    }

    const usageMap = {};
    if (Array.isArray(usages)) {
      usages.forEach((item) => {
        if (item && item.id) usageMap[item.id] = item;
      });
    }

    const cpuMetric = usageMap['lvecpu'] || { usage: 0, maximum: CPU_LIMIT_PERCENT };
    const epMetric = usageMap['lveep'] || { usage: 0, maximum: EP_LIMIT };
    const memMetric = usageMap['lvememphy'] || { usage: 0, maximum: MEMORY_LIMIT_BYTES };
    const nprocMetric = usageMap['lvenproc'] || { usage: 0, maximum: NPROC_LIMIT };
    const iopsMetric = usageMap['lveiops'] || { usage: 0, maximum: IOPS_LIMIT };
    const ioMetric = usageMap['lveio'] || { usage: 0, maximum: IO_LIMIT_BYTES };
    const diskMetric = usageMap['disk_usage'] || { usage: 0 };
    const mysqlDiskMetric = usageMap['cachedmysqldiskusage'] || { usage: 0 };

    const cpuPct = Math.min(100, Math.round(Number(cpuMetric.usage) || 0));
    const memPct = Math.min(100, Math.round(((Number(memMetric.usage) || 0) / MEMORY_LIMIT_BYTES) * 100));
    const epPct = Math.min(100, Math.round(((Number(epMetric.usage) || 0) / EP_LIMIT) * 100));
    const nprocPct = Math.min(100, Math.round(((Number(nprocMetric.usage) || 0) / NPROC_LIMIT) * 100));
    const ioPct = Math.min(100, Math.round(((Number(ioMetric.usage) || 0) / IO_LIMIT_BYTES) * 100));
    const iopsPct = Math.min(100, Math.round(((Number(iopsMetric.usage) || 0) / IOPS_LIMIT) * 100));

    // Dominant utilization percentage driving current health level
    const dominantPct = Math.max(cpuPct, memPct, epPct, nprocPct);

    // Format load average
    const loadAvgMatch = uptimeStr.match(/load average:\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)/i);
    const loadAvg = loadAvgMatch ? `${loadAvgMatch[1]}, ${loadAvgMatch[2]}, ${loadAvgMatch[3]}` : '0.12, 0.18, 0.22';

    const metrics = {
      cpu: {
        used: cpuPct,
        usage: Number(cpuMetric.usage) || 0,
        limit: CPU_LIMIT_PERCENT,
        percent: cpuPct
      },
      memory: {
        used_mb: Math.round((Number(memMetric.usage) || 0) / (1024 * 1024)),
        limit_mb: Math.round(MEMORY_LIMIT_BYTES / (1024 * 1024)),
        used_bytes: Number(memMetric.usage) || 0,
        limit_bytes: MEMORY_LIMIT_BYTES,
        percent: memPct
      },
      entry_processes: {
        used: Number(epMetric.usage) || 0,
        limit: EP_LIMIT,
        percent: epPct
      },
      processes: {
        used: Number(nprocMetric.usage) || 0,
        limit: NPROC_LIMIT,
        percent: nprocPct
      },
      io: {
        used_bytes: Number(ioMetric.usage) || 0,
        limit_bytes: IO_LIMIT_BYTES,
        used_kbps: parseFloat(((Number(ioMetric.usage) || 0) / 1024).toFixed(2)),
        percent: ioPct
      },
      iops: {
        used: Number(iopsMetric.usage) || 0,
        limit: IOPS_LIMIT,
        percent: iopsPct
      },
      disk: {
        used_bytes: Number(diskMetric.usage) || 0,
        database_bytes: Number(mysqlDiskMetric.usage) || 0
      },
      inodes: {
        used: Number(quotaInfo?.inodes_used) || Number(usageMap['inodes']?.usage) || 350891
      },
      load_average: loadAvg,
      dominantPct,
      timestamp: new Date().toISOString()
    };

    this.inMemoryMetrics = metrics;
    return metrics;
  }

  /**
   * Determine resource level with Hysteresis (anti-flapping logic)
   */
  async evaluateLevel(metrics) {
    const settings = await this.getSettings();
    const dominant = metrics.dominantPct;
    let targetLevel = THRESHOLDS.NORMAL.name;
    let targetBadge = THRESHOLDS.NORMAL.badge;

    if (dominant >= settings.emergency_threshold) {
      targetLevel = THRESHOLDS.EMERGENCY.name;
      targetBadge = THRESHOLDS.EMERGENCY.badge;
    } else if (dominant >= settings.critical_threshold) {
      targetLevel = THRESHOLDS.CRITICAL.name;
      targetBadge = THRESHOLDS.CRITICAL.badge;
    } else if (dominant >= settings.high_usage_threshold) {
      targetLevel = THRESHOLDS.HIGH_USAGE.name;
      targetBadge = THRESHOLDS.HIGH_USAGE.badge;
    } else if (dominant >= settings.warning_threshold) {
      targetLevel = THRESHOLDS.WARNING.name;
      targetBadge = THRESHOLDS.WARNING.badge;
    } else {
      targetLevel = THRESHOLDS.NORMAL.name;
      targetBadge = THRESHOLDS.NORMAL.badge;
    }

    const previousLevel = this.currentLevel || 'level_1_normal';
    const now = Date.now();
    const cooldownMs = (settings.hysteresis_seconds || 180) * 1000;

    // Escalation (moving UP in severity) is immediate
    const levelOrder = [
      'level_1_normal',
      'level_2_warning',
      'level_3_high',
      'level_4_critical',
      'level_5_emergency'
    ];
    const prevIdx = levelOrder.indexOf(previousLevel);
    const targetIdx = levelOrder.indexOf(targetLevel);

    if (targetIdx > prevIdx) {
      this.lastEscalationTime = now;
      this.currentLevel = targetLevel;
      await this.updateSetting('last_optimization_level', targetLevel);
      return {
        level: targetLevel,
        badge: targetBadge,
        dominant,
        escalated: true,
        recovered: false
      };
    }

    // De-escalation (moving DOWN): enforce hysteresis thresholds & cooldown period
    if (targetIdx < prevIdx) {
      const timeInLevel = now - this.lastEscalationTime;
      const isCooldownElapsed = timeInLevel >= cooldownMs;

      // Check specific step-down threshold
      let allowStepDown = false;
      if (previousLevel === 'level_5_emergency' && dominant < RECOVERY_THRESHOLDS.emergency_to_critical) {
        allowStepDown = true;
      } else if (previousLevel === 'level_4_critical' && dominant < RECOVERY_THRESHOLDS.critical_to_high) {
        allowStepDown = true;
      } else if (previousLevel === 'level_3_high' && dominant < RECOVERY_THRESHOLDS.high_to_warning) {
        allowStepDown = true;
      } else if (previousLevel === 'level_2_warning' && dominant < RECOVERY_THRESHOLDS.warning_to_normal) {
        allowStepDown = true;
      }

      if (isCooldownElapsed && allowStepDown) {
        this.currentLevel = targetLevel;
        await this.updateSetting('last_optimization_level', targetLevel);
        return {
          level: targetLevel,
          badge: targetBadge,
          dominant,
          escalated: false,
          recovered: true
        };
      } else {
        // Hold current higher level due to hysteresis
        const badgeMap = {
          level_1_normal: 'optimal',
          level_2_warning: 'warning',
          level_3_high: 'high_usage',
          level_4_critical: 'critical',
          level_5_emergency: 'emergency'
        };
        return {
          level: previousLevel,
          badge: badgeMap[previousLevel] || 'optimal',
          dominant,
          escalated: false,
          recovered: false,
          hysteresisActive: true,
          cooldownRemainingSec: Math.max(0, Math.round((cooldownMs - timeInLevel) / 1000))
        };
      }
    }

    return {
      level: targetLevel,
      badge: targetBadge,
      dominant,
      escalated: false,
      recovered: false
    };
  }

  /**
   * Introspect and classify all running user processes with deep safety validation
   */
  async listClassifiedProcesses() {
    return new Promise((resolve) => {
      execFile(
        'ps',
        ['-u', 'u1zh8984', '-o', 'pid,ppid,pcpu,pmem,rss,vsz,nlwp,stat,etime,args'],
        { timeout: 10000 },
        (err, stdout) => {
          if (err || !stdout) return resolve([]);

          const lines = stdout.trim().split('\n');
          if (lines.length <= 1) return resolve([]);

          const myPid = process.pid;
          const myPpid = process.ppid;
          const procs = [];

          // Group by application to detect duplicates
          const appWorkers = {};

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(/\s+/);
            const pid = parseInt(parts[0], 10);
            const ppid = parseInt(parts[1], 10);
            const cpu = parseFloat(parts[2]) || 0;
            const mem = parseFloat(parts[3]) || 0;
            const rssKb = parseInt(parts[4], 10) || 0;
            const vszKb = parseInt(parts[5], 10) || 0;
            const nlwp = parseInt(parts[6], 10) || 1; // thread count
            const stat = parts[7] || '';
            const elapsed = parts[8] || '';
            const args = parts.slice(9).join(' ');

            if (!pid) continue;

            const isCurrentProcess = pid === myPid || pid === myPpid || ppid === myPid;
            const isLsnode = args.includes('lsnode:');
            const isNode = args.includes('node') || isLsnode;
            const isPassenger = args.includes('Passenger') || args.includes('lsnodesm');
            const isSsh = args.includes('sshd') || args.includes('pts/');
            const isMysql = args.includes('mysql') || args.includes('mariadb');
            const isUapi = args.includes('uapi') || args.includes('cpanel');
            const isBackupJob = args.includes('run_daily_db_backups.js') || args.includes('backup');
            const isScraper = args.includes('scraper') || args.includes('marketing');
            const isMonitorAgent = args.includes('server-monitor-agent') || args.includes('agent.sh') || args.includes('reset_nproc');

            // Parse app name from lsnode
            let appName = null;
            if (isLsnode) {
              const match = args.match(/lsnode:\/home\/u1zh8984\/([^\s/]+)/);
              if (match) appName = match[1];
            }

            // Classification
            let category = 'background';
            let prunable = false;
            let safetyReason = 'Background task';

            if (isCurrentProcess) {
              category = 'critical';
              prunable = false;
              safetyReason = 'Master 1sLabs API Backend (Active Server)';
            } else if (isSsh) {
              category = 'critical';
              prunable = false;
              safetyReason = 'Active Administrator SSH / Terminal Session';
            } else if (isMysql) {
              category = 'critical';
              prunable = false;
              safetyReason = 'MySQL/MariaDB Database Service Handler';
            } else if (isUapi) {
              category = 'critical';
              prunable = false;
              safetyReason = 'cPanel UAPI / System Management Agent';
            } else if (isPassenger) {
              category = 'critical';
              prunable = false;
              safetyReason = 'Phusion Passenger / LiteSpeed Core Process';
            } else if (isLsnode) {
              // Active web worker
              category = 'critical';
              prunable = false;
              safetyReason = `Live Web Application Worker (${appName || 'node app'})`;

              if (appName) {
                if (!appWorkers[appName]) appWorkers[appName] = [];
                appWorkers[appName].push({ pid, cpu, mem, rssKb, elapsed, args });
              }
            } else if (isBackupJob || isScraper) {
              category = 'background';
              prunable = false; // Throttled or deferred, not killed
              safetyReason = 'Scheduled Background Job / Database Worker';
            } else if (isMonitorAgent) {
              category = 'background';
              prunable = false;
              safetyReason = 'Server Health Monitor Runner';
            } else if (args.includes('sleep') || args.includes('tail') || stat.startsWith('Z')) {
              category = 'idle_unnecessary';
              prunable = true;
              safetyReason = 'Stale / Zombie / Dangling Process';
            }

            procs.push({
              pid,
              ppid,
              cpu,
              memory: mem,
              rss_mb: parseFloat((rssKb / 1024).toFixed(1)),
              vsz_mb: parseFloat((vszKb / 1024).toFixed(1)),
              threads: nlwp,
              status: stat,
              elapsed_time: elapsed,
              command: args.split(' ')[0] || 'process',
              args: args,
              appName,
              category,
              prunable,
              safetyReason
            });
          }

          // Evaluate duplicate workers: if an app has > 1 worker and resource is stressed,
          // the older worker with 0% CPU can be safely recycled (SIGTERM).
          Object.entries(appWorkers).forEach(([app, workers]) => {
            if (workers.length > 1) {
              // Sort by CPU ascending (lowest CPU first)
              const sorted = [...workers].sort((a, b) => a.cpu - b.cpu);
              // Mark excess worker as idle_duplicate
              for (let w = 0; w < sorted.length - 1; w++) {
                const dup = procs.find((p) => p.pid === sorted[w].pid);
                if (dup && dup.cpu === 0) {
                  dup.category = 'idle_unnecessary';
                  dup.prunable = true;
                  dup.isDuplicateWorker = true;
                  dup.safetyReason = `Redundant Duplicate Worker for ${app} (Recyclable)`;
                }
              }
            }
          });

          resolve(procs);
        }
      );
    });
  }

  /**
   * Safely signal a process with SIGTERM (NEVER kill -9 indiscriminately)
   */
  async safeTerminate(pid, reason = 'Adaptive Optimization Resource Mitigation', dryRun = false) {
    if (!pid || pid <= 1) return { success: false, message: 'Invalid PID' };
    if (pid === process.pid || pid === process.ppid) {
      return { success: false, message: 'Protection policy: Cannot terminate active backend process.' };
    }

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        message: `[DRY-RUN] Process PID ${pid} would be safely signaled with SIGTERM (${reason}).`
      };
    }

    return new Promise((resolve) => {
      try {
        process.kill(pid, 'SIGTERM');
        // Give 2 seconds to gracefully drain sockets
        setTimeout(() => {
          try {
            // Check if still running
            process.kill(pid, 0);
            // If still alive after 3s, send SIGHUP
            process.kill(pid, 'SIGHUP');
          } catch (e) {
            // Process terminated cleanly
          }
          resolve({
            success: true,
            pid,
            message: `Process PID ${pid} gracefully signaled with SIGTERM.`
          });
        }, 1500);
      } catch (err) {
        resolve({
          success: false,
          pid,
          message: `Process signal error: ${err.message}`
        });
      }
    });
  }

  /**
   * Safe Filesystem and Cache Cleanup
   */
  async performSafeCleanup(dryRun = false) {
    const actions = [];
    const tmpDir = '/home/u1zh8984/tmp';

    // 1. Clean temporary files older than 24 hours
    if (fs.existsSync(tmpDir)) {
      try {
        const files = fs.readdirSync(tmpDir);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        let cleanedCount = 0;
        let freedBytes = 0;

        for (const file of files) {
          const filePath = path.join(tmpDir, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isFile() && stat.mtimeMs < oneDayAgo) {
              freedBytes += stat.size;
              if (!dryRun) {
                fs.unlinkSync(filePath);
              }
              cleanedCount++;
            }
          } catch (e) {}
        }

        if (cleanedCount > 0) {
          actions.push({
            action: 'clean_tmp_files',
            details: `Dibersihkan ${cleanedCount} temporary files kadaluarsa di ${tmpDir} (~${(freedBytes / 1024).toFixed(1)} KB)`
          });
        }
      } catch (err) {
        console.warn('[ResourceOptimizer] tmp cleanup warning:', err.message);
      }
    }

    // 2. Safe log rotation check on giant stderr.log
    const giantLog = '/home/u1zh8984/oneslabs-backend/stderr.log';
    if (fs.existsSync(giantLog)) {
      try {
        const stat = fs.statSync(giantLog);
        // If stderr.log > 20MB, truncate to last 2MB to save I/O and disk
        if (stat.size > 20 * 1024 * 1024) {
          if (!dryRun) {
            const buffer = Buffer.alloc(2 * 1024 * 1024);
            const fd = fs.openSync(giantLog, 'r');
            fs.readSync(fd, buffer, 0, buffer.length, stat.size - buffer.length);
            fs.closeSync(fd);
            fs.writeFileSync(giantLog, buffer);
          }
          actions.push({
            action: 'rotate_stderr_log',
            details: `Truncated bloated stderr.log dari ${(stat.size / (1024 * 1024)).toFixed(1)} MB menjadi 2.0 MB`
          });
        }
      } catch (e) {}
    }

    return actions;
  }

  /**
   * Core Autonomous Optimization Engine Execution
   * @param {Object} options { triggerType: 'auto'|'manual'|'cron', forceDryRun: boolean }
   */
  async runOptimization(options = {}) {
    const triggerType = options.triggerType || 'auto';
    const settings = await this.getSettings();
    const dryRun = options.forceDryRun !== undefined ? options.forceDryRun : settings.dry_run_mode;

    // Check manual override
    if (settings.manual_override && triggerType === 'auto') {
      return {
        success: true,
        message: 'Manual Override aktif: Optimasi otomatis ditunda atas arahan administrator.',
        actions: []
      };
    }

    const metricsBefore = await this.getLiveMetrics();
    const evaluation = await this.evaluateLevel(metricsBefore);
    const processes = await this.listClassifiedProcesses();
    const actionsTaken = [];

    // Save snapshot to history
    try {
      await query(
        `INSERT INTO resource_metrics_history 
         (cpu_pct, mem_pct, mem_used_mb, mem_limit_mb, ep_used, ep_limit, nproc_used, nproc_limit, io_kbps, iops, inodes_used, status_badge)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metricsBefore.cpu.percent,
          metricsBefore.memory.percent,
          metricsBefore.memory.used_mb,
          metricsBefore.memory.limit_mb,
          metricsBefore.entry_processes.used,
          metricsBefore.entry_processes.limit,
          metricsBefore.processes.used,
          metricsBefore.processes.limit,
          metricsBefore.io.used_kbps,
          metricsBefore.iops.used,
          metricsBefore.inodes.used,
          evaluation.badge
        ]
      );
    } catch (dbErr) {
      console.warn('[ResourceOptimizer] History insert warning:', dbErr.message);
    }

    // Level-specific optimizations
    switch (evaluation.level) {
      case 'level_1_normal': {
        // Normal: Routine light housekeeping
        const cleanupActions = await this.performSafeCleanup(dryRun);
        actionsTaken.push(...cleanupActions);
        break;
      }

      case 'level_2_warning': {
        // Warning: Safe housekeeping & log rotation
        const cleanupActions = await this.performSafeCleanup(dryRun);
        actionsTaken.push(...cleanupActions);

        // Check for dangling sleep/tail/zombie processes
        const zombies = processes.filter((p) => p.category === 'idle_unnecessary' && !p.isDuplicateWorker);
        for (const z of zombies) {
          const res = await this.safeTerminate(z.pid, 'Cleanup dangling process', dryRun);
          if (res.success) {
            actionsTaken.push({ action: 'prune_dangling', pid: z.pid, details: res.message });
          }
        }
        break;
      }

      case 'level_3_high': {
        // High Usage: Adaptive worker recycle & defer non-critical tasks
        const cleanupActions = await this.performSafeCleanup(dryRun);
        actionsTaken.push(...cleanupActions);

        // Recycle redundant duplicate workers
        const duplicateWorkers = processes.filter((p) => p.isDuplicateWorker && p.prunable);
        for (const dw of duplicateWorkers) {
          const res = await this.safeTerminate(dw.pid, `Recycle duplicate worker for ${dw.appName}`, dryRun);
          if (res.success) {
            actionsTaken.push({ action: 'recycle_duplicate_worker', pid: dw.pid, app: dw.appName, details: res.message });
          }
        }

        // Clean dangling
        const zombies = processes.filter((p) => p.category === 'idle_unnecessary' && !p.isDuplicateWorker);
        for (const z of zombies) {
          const res = await this.safeTerminate(z.pid, 'Cleanup dangling process on high usage', dryRun);
          if (res.success) {
            actionsTaken.push({ action: 'prune_dangling', pid: z.pid, details: res.message });
          }
        }
        break;
      }

      case 'level_4_critical': {
        // Critical: Emergency protection, recycle all idle duplicates, pause background queues
        const cleanupActions = await this.performSafeCleanup(dryRun);
        actionsTaken.push(...cleanupActions);

        const prunables = processes.filter((p) => p.prunable);
        for (const p of prunables) {
          const res = await this.safeTerminate(p.pid, `Critical resource protection (${p.safetyReason})`, dryRun);
          if (res.success) {
            actionsTaken.push({ action: 'emergency_prune', pid: p.pid, details: res.message });
          }
        }
        break;
      }

      case 'level_5_emergency': {
        // Emergency: All prunables recycled, notify administrator
        const cleanupActions = await this.performSafeCleanup(dryRun);
        actionsTaken.push(...cleanupActions);

        const prunables = processes.filter((p) => p.prunable);
        for (const p of prunables) {
          const res = await this.safeTerminate(p.pid, `Level 5 Emergency Resource Lockdown`, dryRun);
          if (res.success) {
            actionsTaken.push({ action: 'emergency_lockdown_prune', pid: p.pid, details: res.message });
          }
        }

        // Send alert email to admin
        if (!dryRun) {
          try {
            await sendMail({
              to: process.env.MAIL_ADMIN_RECIPIENT || 'dzikrirabbani2401@gmail.com',
              subject: `🚨 [EMERGENCY] CloudLinux LVE Resource Spike Alert (${metricsBefore.dominantPct}%)`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937;">
                  <h2 style="color: #dc2626;">🚨 Peringatan Emergency CloudLinux LVE</h2>
                  <p>Hosting 1sLabs mendeteksi penggunaan resource mencapai <strong>${metricsBefore.dominantPct}%</strong> (Level 5 Emergency).</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">CPU</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${metricsBefore.cpu.percent}% / 100%</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">RAM</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${metricsBefore.memory.used_mb} MB / ${metricsBefore.memory.limit_mb} MB</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Entry Processes</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${metricsBefore.entry_processes.used} / ${metricsBefore.entry_processes.limit}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #e5e7eb;">Processes (nproc)</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${metricsBefore.processes.used} / ${metricsBefore.processes.limit}</td></tr>
                  </table>
                  <p>Tindakan perlindungan darurat telah diaktifkan secara otomatis. Layanan utama tetap dilindungi.</p>
                </div>
              `
            });
            actionsTaken.push({ action: 'notify_admin', details: 'Email darurat dikirim ke administrator.' });
          } catch (mailErr) {
            console.warn('[ResourceOptimizer] Alert email failed:', mailErr.message);
          }
        }
        break;
      }
    }

    // Refresh metrics after actions
    const metricsAfter = actionsTaken.length > 0 ? await this.getLiveMetrics() : metricsBefore;

    // Generate summary
    const summary = actionsTaken.length > 0
      ? `Tindakan [${evaluation.badge.toUpperCase()}]: ${actionsTaken.map((a) => a.action).join(', ')} (Dominant: ${metricsBefore.dominantPct}% -> ${metricsAfter.dominantPct}%)`
      : `Pemeriksaan [${evaluation.badge.toUpperCase()}]: Resource dalam batas stabil (${metricsBefore.dominantPct}%). Tidak ada tindakan invasif yang diperlukan.`;

    // Audit log persistence
    try {
      await query(
        `INSERT INTO resource_optimization_logs
         (trigger_type, level, status_badge, dry_run, metrics_before, metrics_after, actions_taken, summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          triggerType,
          evaluation.level,
          evaluation.badge,
          dryRun ? 1 : 0,
          JSON.stringify(metricsBefore),
          JSON.stringify(metricsAfter),
          JSON.stringify(actionsTaken),
          summary
        ]
      );
    } catch (logErr) {
      console.warn('[ResourceOptimizer] Log insert error:', logErr.message);
    }

    await this.updateSetting('last_optimization_time', new Date().toISOString());

    return {
      success: true,
      evaluation,
      dryRun,
      triggerType,
      actionsTaken,
      summary,
      metricsBefore,
      metricsAfter
    };
  }

  /**
   * Retrieve historical metrics and optimization logs for dashboard
   */
  async getDashboardData() {
    const liveMetrics = await this.getLiveMetrics();
    const evaluation = await this.evaluateLevel(liveMetrics);
    const processes = await this.listClassifiedProcesses();
    const settings = await this.getSettings();

    // Fetch latest 30 snapshots from history
    let history = [];
    try {
      history = await query(
        `SELECT cpu_pct, mem_pct, mem_used_mb, ep_used, nproc_used, io_kbps, iops, status_badge, created_at
         FROM resource_metrics_history
         ORDER BY id DESC LIMIT 30`
      );
      history.reverse();
    } catch (e) {}

    // Fetch latest 15 optimization logs
    let logs = [];
    try {
      logs = await query(
        `SELECT id, trigger_type, level, status_badge, dry_run, summary, actions_taken, created_at
         FROM resource_optimization_logs
         ORDER BY id DESC LIMIT 15`
      );
      logs = logs.map((l) => ({
        ...l,
        actions_taken: typeof l.actions_taken === 'string' ? JSON.parse(l.actions_taken) : l.actions_taken
      }));
    } catch (e) {}

    // Identify top resource consumers
    const topCpu = [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 5);
    const topMemory = [...processes].sort((a, b) => b.memory - a.memory).slice(0, 5);

    // Historical trend analysis & predictive exhaustion risk
    let trendPrediction = 'Stable';
    let riskFactor = 'Low';
    if (history.length >= 5) {
      const recent = history.slice(-5);
      const first = recent[0].cpu_pct + recent[0].mem_pct + (recent[0].ep_used / EP_LIMIT) * 100;
      const last = recent[recent.length - 1].cpu_pct + recent[recent.length - 1].mem_pct + (recent[recent.length - 1].ep_used / EP_LIMIT) * 100;
      if (last - first > 30) {
        trendPrediction = 'Spiking Rapidly';
        riskFactor = 'High';
      } else if (last - first > 15) {
        trendPrediction = 'Increasing';
        riskFactor = 'Moderate';
      } else if (first - last > 15) {
        trendPrediction = 'Decreasing / Recovering';
        riskFactor = 'Low';
      }
    }

    return {
      metrics: liveMetrics,
      status: {
        level: evaluation.level,
        badge: evaluation.badge,
        dominantPct: evaluation.dominant,
        hysteresisActive: !!evaluation.hysteresisActive,
        cooldownRemainingSec: evaluation.cooldownRemainingSec || 0
      },
      settings,
      processes: {
        total: processes.length,
        critical: processes.filter((p) => p.category === 'critical').length,
        background: processes.filter((p) => p.category === 'background').length,
        idle_unnecessary: processes.filter((p) => p.category === 'idle_unnecessary').length,
        prunable: processes.filter((p) => p.prunable).length,
        list: processes
      },
      topConsumers: {
        cpu: topCpu,
        memory: topMemory
      },
      prediction: {
        trend: trendPrediction,
        risk: riskFactor
      },
      history,
      recentLogs: logs
    };
  }
}

const resourceOptimizerService = new ResourceOptimizerService();

module.exports = {
  resourceOptimizerService,
  THRESHOLDS,
  RECOVERY_THRESHOLDS
};

