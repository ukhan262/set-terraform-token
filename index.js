const core = require('@actions/core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

(async function run() {
  try {
    const token = core.getInput('tfe_token', { required: true });
    const org = core.getInput('tfe_organization', { required: true });
    const useJson = core.getBooleanInput('use_json');
    const append = core.getBooleanInput('append');
    const logLevel = core.getInput('log_level') || 'info';

    core.setSecret(token); // 🛡️ prevent token leaks

    const log = createLogger(logLevel);

    const homeDir = os.homedir();
    const rcFileName = useJson ? 'credentials.tfrc.json' : '.terraformrc';
    const rcFilePath = path.join(homeDir, rcFileName);

    log(`Config file: ${rcFilePath}`, 'info');

    if (fs.existsSync(rcFilePath)) {
      fs.copyFileSync(rcFilePath, `${rcFilePath}.bak`);
      log(`Backed up existing config to: ${rcFilePath}.bak`, 'warn');
    }

    if (useJson) {
      let credentials = {};
      if (append && fs.existsSync(rcFilePath)) {
        credentials = JSON.parse(fs.readFileSync(rcFilePath, 'utf-8'));
      }
      credentials.credentials = credentials.credentials || {};
      credentials.credentials["app.terraform.io"] = { token };

      fs.writeFileSync(rcFilePath, JSON.stringify(credentials, null, 2));
      log(`Written JSON config`, 'info');
    } else {
      let content = '';
      if (append && fs.existsSync(rcFilePath)) {
        content = fs.readFileSync(rcFilePath, 'utf-8') + '\n';
      }
      content += `credentials "app.terraform.io" {\n  token = "${token}"\n}\n`;
      fs.writeFileSync(rcFilePath, content);
      log(`Written HCL config`, 'info');
    }

    log(`Validating token for org: ${org}`, 'info');
    await validateToken(token, org);
    log(`Token validated for org: ${org}`, 'info');

    core.exportVariable('TF_CLI_CONFIG_FILE', rcFilePath);
  } catch (err) {
    core.setFailed(err.message);
  }
})();

function validateToken(token, org) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'app.terraform.io',
      path: `/api/v2/organizations/${org}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/vnd.api+json'
      }
    }, (res) => {
      if (res.statusCode === 200) return resolve(true);
      if ([401, 403].includes(res.statusCode))
        return reject(new Error(`Invalid token for org ${org} [${res.statusCode}]`));
      if (res.statusCode === 404)
        return reject(new Error(`Organization '${org}' not found [404]`));
      reject(new Error(`Unexpected error validating org [${res.statusCode}]`));
    });

    req.on('error', reject);
    req.end();
  });
}

function createLogger(level) {
  const levels = { debug: 0, info: 1, warn: 2 };
  const current = typeof levels[level] !== 'undefined' ? levels[level] : 1;
  return (msg, msgLevel = 'info') => {
    if (levels[msgLevel] >= current) {
      const prefix = msgLevel === 'warn' ? '::warning::' :
                     msgLevel === 'debug' ? '::debug::' : '';
      console.log(`${prefix}${msg}`);
    }
  };
}
