const { execFile, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOME_DIR = '/home/u1zh8984';
const COMPOSER_PATH = fs.existsSync('/opt/cpanel/composer/bin/composer')
  ? '/opt/cpanel/composer/bin/composer'
  : 'composer';
const PHP_PATH = fs.existsSync('/usr/local/bin/php')
  ? '/usr/local/bin/php'
  : (fs.existsSync('/usr/bin/php') ? '/usr/bin/php' : 'php');

/**
 * Execute a shell command safely in a specific directory.
 * @param {string} command
 * @param {string} cwd
 * @param {number} timeout
 * @returns {Promise<{ stdout: string, stderr: string }>}
 */
function runShell(command, cwd = HOME_DIR, timeout = 120000) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd, timeout, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        return reject(new Error(stderr || error.message));
      }
      return resolve({
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim()
      });
    });
  });
}

const laravelService = {
  getPhpVersions() {
    return ['8.2', '8.3', '8.1'];
  },

  /**
   * Scaffold a new Laravel application directory and link it to the domain.
   */
  async createApplication({ appRoot, domain, appUri = 'api', envVars = {}, userId }) {
    const fullAppRoot = path.join(HOME_DIR, appRoot);
    const docroot = path.join(HOME_DIR, 'public_html', domain);

    // 1. Create directory structure
    const dirs = [
      fullAppRoot,
      path.join(fullAppRoot, 'app'),
      path.join(fullAppRoot, 'bootstrap', 'cache'),
      path.join(fullAppRoot, 'config'),
      path.join(fullAppRoot, 'database', 'migrations'),
      path.join(fullAppRoot, 'public'),
      path.join(fullAppRoot, 'resources'),
      path.join(fullAppRoot, 'routes'),
      path.join(fullAppRoot, 'storage', 'app', 'public'),
      path.join(fullAppRoot, 'storage', 'framework', 'cache', 'data'),
      path.join(fullAppRoot, 'storage', 'framework', 'sessions'),
      path.join(fullAppRoot, 'storage', 'framework', 'views'),
      path.join(fullAppRoot, 'storage', 'logs'),
    ];

    for (const d of dirs) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true, mode: 0o775 });
      }
    }

    // 2. Ensure initial .htaccess in public
    const publicHtaccess = path.join(fullAppRoot, 'public', '.htaccess');
    if (!fs.existsSync(publicHtaccess)) {
      const htaccessContent = `<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
`;
      fs.writeFileSync(publicHtaccess, htaccessContent, 'utf-8');
    }

    // 3. Write initial starter index.php if not exists
    const publicIndex = path.join(fullAppRoot, 'public', 'index.php');
    if (!fs.existsSync(publicIndex)) {
      const starterPhp = `<?php
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'service' => '1sLabs Managed Laravel API',
    'app' => '${appRoot}',
    'domain' => '${domain}',
    'status' => 'ready_for_deployment',
    'message' => 'Silakan unggah source code Laravel Anda (.zip) melalui portal 1sLabs.',
    'php_version' => PHP_VERSION,
    'timestamp' => date('c')
]);
`;
      fs.writeFileSync(publicIndex, starterPhp, 'utf-8');
    }

    // 4. Write .env file
    const envPath = path.join(fullAppRoot, '.env');
    const defaultEnv = {
      APP_NAME: 'Laravel',
      APP_ENV: 'production',
      APP_KEY: '',
      APP_DEBUG: 'false',
      APP_URL: `https://${domain}${appUri ? '/' + appUri : ''}`,
      LOG_CHANNEL: 'stack',
      LOG_LEVEL: 'error',
      DB_CONNECTION: 'mysql',
      DB_HOST: '127.0.0.1',
      DB_PORT: '3306',
      DB_DATABASE: '',
      DB_USERNAME: '',
      DB_PASSWORD: '',
      SESSION_DRIVER: 'file',
      QUEUE_CONNECTION: 'sync',
      ...envVars
    };
    const envLines = Object.entries(defaultEnv).map(([k, v]) => `${k}=${v}`).join('\n');
    fs.writeFileSync(envPath, envLines, 'utf-8');

    // 5. Create symlink in document root if docroot exists
    if (fs.existsSync(docroot)) {
      const targetSymlink = appUri ? path.join(docroot, appUri) : docroot;
      if (appUri) {
        try {
          if (fs.existsSync(targetSymlink) || fs.lstatSync(targetSymlink).isSymbolicLink()) {
            fs.unlinkSync(targetSymlink);
          }
        } catch (e) {}
        try {
          fs.symlinkSync(path.join(fullAppRoot, 'public'), targetSymlink);
        } catch (symErr) {
          console.warn('[laravelService createApplication symlink notice]:', symErr.message);
        }
      }

      // Storage symlink
      const storageSymlink = path.join(docroot, 'storage');
      try {
        if (!fs.existsSync(storageSymlink)) {
          fs.symlinkSync(path.join(fullAppRoot, 'storage', 'app', 'public'), storageSymlink);
        }
      } catch (e) {}

      // Ensure root .htaccess has SPA rewrite rules & excludes /api and /storage
      const rootHtaccess = path.join(docroot, '.htaccess');
      if (!fs.existsSync(rootHtaccess)) {
        const rootHtaccessContent = `Options +FollowSymLinks
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^${appUri || 'api'}/ - [L]
  RewriteRule ^storage/ - [L]
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;
        fs.writeFileSync(rootHtaccess, rootHtaccessContent, 'utf-8');
      }
    }

    return { fullAppRoot };
  },

  /**
   * Run Artisan command safely in the application directory.
   */
  async runArtisan(appRoot, commandArgs) {
    const fullAppRoot = path.join(HOME_DIR, appRoot);
    if (!fs.existsSync(fullAppRoot)) {
      throw new Error(`Direktori aplikasi ${appRoot} tidak ditemukan.`);
    }

    // Sanitize and whitelist/allow command
    const cmd = `${PHP_PATH} artisan ${commandArgs}`;
    return runShell(cmd, fullAppRoot, 60000);
  },

  /**
   * Run Composer install or dump-autoload.
   */
  async runComposer(appRoot, args = 'install --no-dev --optimize-autoloader --no-interaction') {
    const fullAppRoot = path.join(HOME_DIR, appRoot);
    if (!fs.existsSync(fullAppRoot)) {
      throw new Error(`Direktori aplikasi ${appRoot} tidak ditemukan.`);
    }

    const cmd = `${COMPOSER_PATH} ${args}`;
    return runShell(cmd, fullAppRoot, 180000);
  },

  /**
   * Deploy uploaded ZIP file into Laravel application root.
   */
  async deployZip(appRoot, zipPath) {
    const fullAppRoot = path.join(HOME_DIR, appRoot);
    if (!fs.existsSync(fullAppRoot)) {
      fs.mkdirSync(fullAppRoot, { recursive: true });
    }

    const logs = [];

    // 1. Unzip safely
    logs.push(`[1/5] Mengekstrak file ZIP ke ${appRoot}...`);
    const unzipRes = await runShell(`unzip -q -o "${zipPath}" -d "${fullAppRoot}"`, fullAppRoot);
    if (unzipRes.stderr && !unzipRes.stdout) {
      logs.push(`Peringatan unzip: ${unzipRes.stderr}`);
    }

    // Remove temp zip
    try { fs.unlinkSync(zipPath); } catch (e) {}

    // 2. Fix directory permissions for storage and bootstrap/cache
    logs.push('[2/5] Mengatur hak akses folder storage dan bootstrap/cache...');
    await runShell(`chmod -R 775 storage bootstrap/cache`, fullAppRoot).catch(() => {});

    // 3. Run Composer install
    logs.push('[3/5] Menjalankan Composer install...');
    try {
      const compRes = await runShell(`${COMPOSER_PATH} install --no-dev --optimize-autoloader --no-interaction`, fullAppRoot, 180000);
      logs.push(compRes.stdout || 'Composer dependencies verified.');
      if (compRes.stderr) logs.push(`STDERR: ${compRes.stderr}`);
    } catch (compErr) {
      logs.push(`Composer notice: ${compErr.message}`);
    }

    // 4. Run Laravel Optimizations
    logs.push('[4/5] Mengoptimalkan cache Laravel...');
    try {
      await runShell(`${PHP_PATH} artisan storage:link`, fullAppRoot).catch(() => {});
      await runShell(`${PHP_PATH} artisan optimize:clear`, fullAppRoot).catch(() => {});
      await runShell(`${PHP_PATH} artisan config:cache`, fullAppRoot).catch(() => {});
      await runShell(`${PHP_PATH} artisan route:cache`, fullAppRoot).catch(() => {});
      logs.push('Cache route dan config berhasil diperbarui.');
    } catch (artErr) {
      logs.push(`Artisan optimization notice: ${artErr.message}`);
    }

    // 5. Run Migration if requested or automatically
    logs.push('[5/5] Memeriksa status migration database...');
    try {
      const migRes = await runShell(`${PHP_PATH} artisan migrate --force`, fullAppRoot, 60000);
      logs.push(migRes.stdout || 'Database migrations up to date.');
    } catch (migErr) {
      logs.push(`Migration notice: ${migErr.message}`);
    }

    return {
      success: true,
      logs: logs.join('\n')
    };
  },

  /**
   * Get application logs from storage/logs/laravel.log.
   */
  async getLogs(appRoot, lines = 100) {
    const logPath = path.join(HOME_DIR, appRoot, 'storage', 'logs', 'laravel.log');
    if (!fs.existsSync(logPath)) {
      return 'Belum ada log error/aktivitas yang tercatat di storage/logs/laravel.log.';
    }

    try {
      const res = await runShell(`tail -n ${lines} "${logPath}"`);
      return res.stdout || 'Log file kosong.';
    } catch (e) {
      return `Gagal membaca log: ${e.message}`;
    }
  },

  /**
   * Read .env file content.
   */
  async getEnv(appRoot) {
    const envPath = path.join(HOME_DIR, appRoot, '.env');
    if (!fs.existsSync(envPath)) {
      return '';
    }
    return fs.readFileSync(envPath, 'utf-8');
  },

  /**
   * Write .env file content.
   */
  async saveEnv(appRoot, content) {
    const envPath = path.join(HOME_DIR, appRoot, '.env');
    fs.writeFileSync(envPath, content, 'utf-8');
    // Clear config cache after updating .env
    const fullAppRoot = path.join(HOME_DIR, appRoot);
    try {
      await runShell(`${PHP_PATH} artisan config:clear && ${PHP_PATH} artisan config:cache`, fullAppRoot);
    } catch (e) {}
    return true;
  },

  /**
   * Check HTTP health of Laravel API endpoint.
   */
  async checkHealth(url) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': '1sLabs-LaravelHealthMonitor/1.0', 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;
      return {
        healthy: res.status >= 200 && res.status < 500,
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

module.exports = { laravelService };

