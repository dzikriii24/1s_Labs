const fs = require('fs');
const p = '/home/u1zh8984/server-monitor-agent/agent.sh';
if (fs.existsSync(p)) {
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(
    /killall -9 -u \$\(whoami\)[\s\S]*?pkill -9 -u \$\(whoami\)/,
    '/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node /home/u1zh8984/oneslabs-backend/scripts/run_resource_optimizer.js --force >> /home/u1zh8984/tmp/optimizer.log 2>&1'
  );
  fs.writeFileSync(p, s);
  console.log('agent.sh safely patched!');
} else {
  console.log('agent.sh does not exist');
}

