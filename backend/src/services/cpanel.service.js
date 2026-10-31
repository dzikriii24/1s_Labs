const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const UAPI_PATH = '/usr/bin/uapi';
const HAS_UAPI = fs.existsSync(UAPI_PATH);

const CLOUDLINUX_SELECTOR_PATH = fs.existsSync('/usr/sbin/cloudlinux-selector')
  ? '/usr/sbin/cloudlinux-selector'
  : 'cloudlinux-selector';

/**
 * Execute a cPanel UAPI command securely via execFile (no shell interpolation).
 * @param {string} module cPanel module name (e.g., 'Mysql', 'Ftp', 'Quota', 'SubDomain', 'AddonDomain')
 * @param {string} func cPanel function name (e.g., 'list_databases', 'add_ftp', 'addsubdomain')
 * @param {Object} args Key-value argument map
 * @returns {Promise<any>}
 */
function execUapi(module, func, args = {}) {
  return new Promise((resolve, reject) => {
    if (!HAS_UAPI) {
      console.warn(`[cPanel Service] UAPI not found at ${UAPI_PATH} (running in simulated/dev mode)`);
      return resolve({
        isSimulated: true,
        status: 1,
        data: null,
        message: 'cPanel UAPI is running in simulated environment (local dev)'
      });
    }

    const commandArgs = ['--output=json', module, func];
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        commandArgs.push(`${key}=${value}`);
      }
    }

    execFile(UAPI_PATH, commandArgs, { timeout: 35000 }, (error, stdout, stderr) => {
      // Note: cPanel often prints warning about adminbin on stderr even on success, so we rely on stdout JSON
      if (error && !stdout) {
        console.error(`[cPanel UAPI Error] ${module}::${func}:`, error.message);
        return reject(new Error(error.message || `Eksekusi UAPI ${module}::${func} gagal.`));
      }

      try {
        const parsed = JSON.parse(stdout);
        const result = parsed.result || {};

        if (result.status === 0 || (result.errors && result.errors.length > 0)) {
          const errMessage = (result.errors && result.errors.join('; ')) || 'Operasi cPanel UAPI gagal.';
          return reject(new Error(errMessage));
        }

        return resolve(result.data !== undefined ? result.data : result);
      } catch (parseError) {
        console.error('[cPanel UAPI Parse Error] Raw stdout:', stdout);
        return reject(new Error('Gagal memproses respon data dari cPanel UAPI.'));
      }
    });
  });
}

/**
 * Execute CloudLinux Selector CLI command securely via execFile.
 * @param {Array<string>} args
 * @returns {Promise<any>}
 */
function execSelector(args = []) {
  return new Promise((resolve, reject) => {
    execFile(CLOUDLINUX_SELECTOR_PATH, args, { timeout: 45000 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        console.error('[CloudLinux Selector Error]:', error.message);
        return reject(new Error(error.message || 'Eksekusi CloudLinux Selector gagal.'));
      }

      try {
        const parsed = JSON.parse(stdout);
        if (parsed.result && typeof parsed.result === 'string' && parsed.result.startsWith('ERROR')) {
          return reject(new Error(parsed.result));
        }
        return resolve(parsed);
      } catch (parseErr) {
        if (stdout && stdout.trim()) {
          return resolve({ raw: stdout.trim() });
        }
        return reject(new Error(stderr || 'Respon kosong dari CloudLinux Selector.'));
      }
    });
  });
}

// === FTP OPERATIONS ===
const ftpService = {
  async listAccounts() {
    return execUapi('Ftp', 'list_ftp');
  },

  async createAccount(username, password, homedir, quotaMb = 0) {
    if (!username || !password || !homedir) {
      throw new Error('Username, password, dan homedir wajib diisi.');
    }
    return execUapi('Ftp', 'add_ftp', {
      user: username,
      pass: password,
      homedir,
      quota: quotaMb
    });
  },

  async changePassword(username, newPassword) {
    if (!username || !newPassword) {
      throw new Error('Username dan password baru wajib diisi.');
    }
    return execUapi('Ftp', 'passwd', {
      user: username,
      pass: newPassword
    });
  },

  async deleteAccount(username, destroyHomedir = 0) {
    if (!username) {
      throw new Error('Username FTP wajib diisi.');
    }
    return execUapi('Ftp', 'delete_ftp', {
      user: username,
      destroy: destroyHomedir ? 1 : 0
    });
  }
};

// === MYSQL / MARIADB OPERATIONS ===
const mysqlService = {
  async listDatabases() {
    return execUapi('Mysql', 'list_databases');
  },

  async createDatabase(dbName) {
    if (!dbName || !/^[a-zA-Z0-9_]+$/.test(dbName)) {
      throw new Error('Nama database hanya boleh berisi huruf, angka, dan underscore.');
    }
    return execUapi('Mysql', 'create_database', { name: dbName });
  },

  async deleteDatabase(fullDbName) {
    if (!fullDbName) throw new Error('Nama database wajib diisi.');
    return execUapi('Mysql', 'delete_database', { name: fullDbName });
  },

  async createUser(username, password) {
    if (!username || !password) {
      throw new Error('Username dan password database wajib diisi.');
    }
    return execUapi('Mysql', 'create_user', { name: username, password });
  },

  async deleteUser(fullUserName) {
    if (!fullUserName) throw new Error('Username database wajib diisi.');
    return execUapi('Mysql', 'delete_user', { name: fullUserName });
  },

  async setPrivileges(fullDbName, fullUserName, privileges = 'ALL PRIVILEGES') {
    return execUapi('Mysql', 'set_privileges_on_database', {
      database: fullDbName,
      user: fullUserName,
      privileges
    });
  }
};

// === QUOTA & RESOURCES ===
const quotaService = {
  async getQuota() {
    return execUapi('Quota', 'get_quota_info');
  }
};

// === DOMAIN & VIRTUAL HOST OPERATIONS (cPanel AddonDomain) ===
const domainService = {
  async listAddonDomains() {
    return execUapi('AddonDomain', 'listaddondomains');
  },

  async addAddonDomain(domain, subDomain = null, dir = null) {
    if (!domain || typeof domain !== 'string') {
      throw new Error('Nama domain wajib diisi.');
    }
    const cleanDomain = domain.trim().toLowerCase();
    // Subdomain alias prefix (letters and numbers only, max 32 chars)
    const cleanSubdomain = (subDomain || cleanDomain.replace(/[^a-zA-Z0-9]/g, '')).slice(0, 32);
    // Document root matches cPanel public_html/{domain}
    const docroot = dir || `public_html/${cleanDomain}`;

    try {
      const res = await execUapi('AddonDomain', 'addaddondomain', {
        dir: docroot,
        newdomain: cleanDomain,
        subdomain: cleanSubdomain,
        ftp_is_optional: 1
      });
      console.log(`[cPanel Service] Successfully registered addon domain: ${cleanDomain} -> ${docroot}`);
      return res;
    } catch (err) {
      const msg = err.message || '';
      // If already registered / parked in cPanel, treat as idempotent success
      if (
        msg.includes('already exists') ||
        msg.includes('already parked') ||
        msg.includes('already configured') ||
        msg.includes('is already configured') ||
        msg.includes('Subdomain already exists')
      ) {
        console.log(`[cPanel Service] Domain ${cleanDomain} already active in cPanel: ${msg}`);
        return { alreadyExists: true, domain: cleanDomain, message: msg };
      }
      console.error(`[cPanel Service] Error adding addon domain ${cleanDomain}:`, msg);
      throw err;
    }
  },

  async deleteAddonDomain(domain, subDomain = null) {
    if (!domain) throw new Error('Nama domain wajib diisi.');
    const cleanDomain = domain.trim().toLowerCase();
    const cleanSubdomain = (subDomain || cleanDomain.replace(/[^a-zA-Z0-9]/g, '')).slice(0, 32);
    return execUapi('AddonDomain', 'deladdondomain', {
      domain: cleanDomain,
      subdomain: cleanSubdomain
    });
  }
};

// === SUBDOMAIN OPERATIONS (cPanel SubDomain UAPI) ===
const subdomainService = {
  async listSubdomains() {
    const res = await execUapi('SubDomain', 'listsubdomains');
    return Array.isArray(res) ? res : (res?.data || []);
  },

  async getReservedSubdomains() {
    const res = await execUapi('SubDomain', 'getreservedsubdomains');
    return Array.isArray(res) ? res : (res?.data || []);
  },

  async addSubdomain(subdomain, rootdomain = '1slabs.my.id', dir = null) {
    if (!subdomain || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(subdomain)) {
      throw new Error('Nama subdomain tidak valid (gunakan huruf kecil, angka, tanda hubung, 3-63 karakter).');
    }
    const cleanSub = subdomain.trim().toLowerCase();
    const docroot = dir || `public_html/${cleanSub}.${rootdomain}`;

    try {
      const res = await execUapi('SubDomain', 'addsubdomain', {
        domain: cleanSub,
        rootdomain: rootdomain,
        dir: docroot
      });
      console.log(`[cPanel Subdomain] Added ${cleanSub}.${rootdomain} -> ${docroot}`);
      return res;
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('already exists') ||
        msg.includes('already configured') ||
        msg.includes('is already configured')
      ) {
        return { alreadyExists: true, domain: `${cleanSub}.${rootdomain}`, message: msg };
      }
      throw err;
    }
  },

  async delSubdomain(domain) {
    if (!domain) throw new Error('Nama domain/subdomain wajib diisi.');
    return execUapi('SubDomain', 'delsubdomain', {
      domain: domain.trim().toLowerCase()
    });
  },

  async checkAvailability(subdomain, rootdomain = '1slabs.my.id') {
    const cleanSub = subdomain.trim().toLowerCase();
    
    // System reserved blacklist
    const systemReserved = [
      'mail', 'cpanel', 'whm', 'webmail', 'demo', 'api', 'admin', 'administrator',
      'ns1', 'ns2', 'ns3', 'ns4', 'dns', 'mx', 'ftp', 'smtp', 'pop', 'imap',
      'root', 'test', 'testing', 'dev', 'developer', 'staging', 'prod', 'production',
      'app', 'apps', 'auth', 'oneslabs', '1slabs', 'status', 'portal', 'server',
      'panel', 'dashboard', 'billing', 'support', 'help', 'blog', 'shop', 'store'
    ];

    if (systemReserved.includes(cleanSub)) {
      return { available: false, reason: 'Nama subdomain ini dicadangkan untuk infrastruktur sistem 1sLabs.' };
    }

    try {
      const subs = await this.listSubdomains();
      const conflict = subs.find(s => 
        (s.subdomain && s.subdomain.toLowerCase() === cleanSub && s.rootdomain === rootdomain) ||
        (s.domain && s.domain.toLowerCase() === `${cleanSub}.${rootdomain}`)
      );
      if (conflict) {
        return { available: false, reason: 'Subdomain ini sudah aktif digunakan di server cPanel.' };
      }
      return { available: true };
    } catch (err) {
      console.warn('[cPanel checkAvailability notice]:', err.message);
      return { available: true };
    }
  }
};

// === NODE.JS APPLICATION MANAGER (CloudLinux Node.js Selector) ===
const nodejsService = {
  async getAvailableVersions() {
    try {
      const res = await execSelector(['get', '--json', '--interpreter', 'nodejs']);
      const versions = res?.available_versions ? Object.keys(res.available_versions) : ['10.24.1', '20.20.2', '22.23.4', '24.22.1'];
      return versions;
    } catch (err) {
      console.warn('[nodejsService getAvailableVersions error]:', err.message);
      return ['20.20.2', '22.23.4', '24.22.1'];
    }
  },

  async listApplications() {
    try {
      const res = await execSelector(['get', '--json', '--interpreter', 'nodejs', '--user', 'u1zh8984']);
      const apps = [];
      const versions = res?.available_versions || {};
      for (const [ver, verData] of Object.entries(versions)) {
        const userApps = verData?.users?.['u1zh8984']?.applications || {};
        for (const [appName, appData] of Object.entries(userApps)) {
          apps.push({
            app_name: appName,
            version: ver,
            ...appData
          });
        }
      }
      return apps;
    } catch (err) {
      console.warn('[nodejsService listApplications error]:', err.message);
      return [];
    }
  },

  async createApplication({ appRoot, appUri, domain, version = '22.23.4', appMode = 'production', startupFile = 'index.js' }) {
    const cleanRoot = appRoot.trim().replace(/^\/+/, '');
    const cleanUri = appUri ? appUri.trim().replace(/^\/+/, '') : '';
    const cleanDomain = domain.trim().toLowerCase();
    const args = [
      'create', '--json', '--interpreter', 'nodejs',
      '--app-root', cleanRoot,
      '--app-uri', cleanUri,
      '--domain', cleanDomain,
      '--version', version,
      '--app-mode', appMode,
      '--startup-file', startupFile
    ];
    return execSelector(args);
  },

  async updateApplication({ appRoot, newVersion, appMode, startupFile, newAppRoot, envVars }) {
    const cleanRoot = appRoot.trim().replace(/^\/+/, '');
    const args = ['set', '--json', '--interpreter', 'nodejs', '--app-root', cleanRoot];
    if (newVersion) args.push('--new-version', newVersion);
    if (appMode) args.push('--app-mode', appMode);
    if (startupFile) args.push('--startup-file', startupFile);
    if (newAppRoot) args.push('--new-app-root', newAppRoot.trim().replace(/^\/+/, ''));
    if (envVars && typeof envVars === 'object') {
      args.push('--env-vars', JSON.stringify(envVars));
    }
    return execSelector(args);
  },

  async startApplication(appRoot) {
    const cleanRoot = appRoot.trim().replace(/^\/+/, '');
    return execSelector(['start', '--json', '--interpreter', 'nodejs', '--app-root', cleanRoot]);
  },

  async stopApplication(appRoot) {
    const cleanRoot = appRoot.trim().replace(/^\/+/, '');
    return execSelector(['stop', '--json', '--interpreter', 'nodejs', '--app-root', cleanRoot]);
  },

  async restartApplication(appRoot) {
    const cleanRoot = appRoot.trim().replace(/^\/+/, '');
    const restartFile = path.join('/home/u1zh8984', cleanRoot, 'tmp', 'restart.txt');
    try {
      if (fs.existsSync(path.dirname(restartFile))) {
        fs.utimesSync(restartFile, new Date(), new Date());
      }
    } catch (e) {
      // ignore
    }
    return execSelector(['restart', '--json', '--interpreter', 'nodejs', '--app-root', cleanRoot]);
  },

  async destroyApplication(appRoot) {
    const cleanRoot = appRoot.trim().replace(/^\/+/, '');
    return execSelector(['destroy', '--json', '--interpreter', 'nodejs', '--app-root', cleanRoot]);
  },

  async installModules(appRoot) {
    const cleanRoot = appRoot.trim().replace(/^\/+/, '');
    return execSelector(['install-modules', '--json', '--interpreter', 'nodejs', '--app-root', cleanRoot, '--skip-web-check']);
  },

  async checkHealth(url) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': '1sLabs-HealthMonitor/1.0' }
      });
      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;
      return {
        healthy: res.status >= 200 && res.status < 400,
        status: res.status,
        statusText: res.statusText,
        responseTimeMs,
        checkedAt: new Date().toISOString()
      };
    } catch (err) {
      return {
        healthy: false,
        status: 0,
        statusText: err.name === 'AbortError' ? 'Timeout' : err.message,
        responseTimeMs: Date.now() - startTime,
        checkedAt: new Date().toISOString()
      };
    }
  }
};

// === RESOURCE & SERVER HEALTH (CloudLinux LVE / cPanel UAPI) ===
const resourceService = {
  async getUsages() {
    const data = await execUapi('ResourceUsage', 'get_usages');
    return Array.isArray(data) ? data : (data?.data || []);
  },
  async getServerInfo() {
    const data = await execUapi('ServerInformation', 'get_information');
    return Array.isArray(data) ? data : (data?.data || []);
  },
  async getStatsBar() {
    const data = await execUapi('StatsBar', 'get_stats');
    return Array.isArray(data) ? data : (data?.data || []);
  }
};

// === SSL CERTIFICATES & AUTOSSL OPERATIONS ===
const sslService = {
  async getInstalledHosts() {
    const data = await execUapi('SSL', 'installed_hosts');
    return Array.isArray(data) ? data : (data?.data || []);
  },
  async listCerts() {
    const data = await execUapi('SSL', 'list_certs');
    return Array.isArray(data) ? data : (data?.data || []);
  },
  async startAutoSslCheck() {
    return execUapi('SSL', 'start_autossl_check');
  },
  async isAutoSslInProgress() {
    return execUapi('SSL', 'is_autossl_check_in_progress');
  },
  async getAutoSslProblems() {
    const data = await execUapi('SSL', 'get_autossl_problems');
    return Array.isArray(data) ? data : (data?.data || []);
  },
  async getAutoSslRenewalStatus() {
    return execUapi('SSL', 'get_autossl_renewal_status');
  }
};

// === SAFE PROCESS & SYSTEM MONITORING ===
const systemProcessService = {
  async listProcesses() {
    return new Promise((resolve) => {
      execFile('ps', ['-u', 'u1zh8984', '-o', 'pid,%cpu,%mem,etime,args'], { timeout: 10000 }, (err, stdout) => {
        if (err || !stdout) {
          return resolve([]);
        }
        const lines = stdout.trim().split('\n');
        if (lines.length <= 1) return resolve([]);
        const procs = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(/\s+/);
          const pid = parseInt(parts[0], 10);
          const cpu = parseFloat(parts[1]) || 0;
          const mem = parseFloat(parts[2]) || 0;
          const elapsed = parts[3] || '';
          const command = parts.slice(4).join(' ');
          if (pid && command) {
            procs.push({ pid, cpu, mem, elapsed, command });
          }
        }
        resolve(procs);
      });
    });
  },

  async terminateProcess(targetPid) {
    const pid = parseInt(targetPid, 10);
    if (!pid || pid <= 1) {
      throw new Error('PID proses tidak valid.');
    }
    if (pid === process.pid || pid === process.ppid) {
      throw new Error('Dilarang mematikan proses master server yang sedang aktif.');
    }

    const procs = await this.listProcesses();
    const targetProc = procs.find(p => p.pid === pid);
    if (!targetProc) {
      throw new Error(`Proses dengan PID ${pid} tidak ditemukan atau bukan milik akun ini.`);
    }

    const cmdLower = targetProc.command.toLowerCase();
    if (cmdLower.includes('passenger') && cmdLower.includes('core')) {
      throw new Error('Dilarang mematikan Passenger Core daemon.');
    }

    return new Promise((resolve, reject) => {
      execFile('kill', ['-15', String(pid)], (err) => {
        if (err) {
          execFile('kill', ['-9', String(pid)], (err2) => {
            if (err2) return reject(new Error(`Gagal menghentikan proses: ${err2.message}`));
            resolve({ success: true, pid, command: targetProc.command, forceKilled: true });
          });
        } else {
          resolve({ success: true, pid, command: targetProc.command, forceKilled: false });
        }
      });
    });
  },

  async getUptime() {
    return new Promise((resolve) => {
      execFile('uptime', [], (err, stdout) => {
        if (err || !stdout) return resolve('Uptime info unavailable');
        resolve(stdout.trim());
      });
    });
  }
};

module.exports = {
  execUapi,
  execSelector,
  ftpService,
  mysqlService,
  quotaService,
  domainService,
  subdomainService,
  nodejsService,
  resourceService,
  sslService,
  systemProcessService,
  HAS_UAPI
};
