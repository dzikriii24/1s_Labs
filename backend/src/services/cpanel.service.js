const { execFile } = require('child_process');
const fs = require('fs');

const UAPI_PATH = '/usr/bin/uapi';
const HAS_UAPI = fs.existsSync(UAPI_PATH);

/**
 * Execute a cPanel UAPI command securely via execFile (no shell interpolation).
 * @param {string} module cPanel module name (e.g., 'Mysql', 'Ftp', 'Quota')
 * @param {string} func cPanel function name (e.g., 'list_databases', 'add_ftp')
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

    execFile(UAPI_PATH, commandArgs, { timeout: 25000 }, (error, stdout, stderr) => {
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

// === DOMAIN & VIRTUAL HOST OPERATIONS (cPanel Jupiter Domains) ===
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

module.exports = {
  execUapi,
  ftpService,
  mysqlService,
  quotaService,
  domainService,
  HAS_UAPI
};
