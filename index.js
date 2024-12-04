import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import cluster from 'cluster';
import { watchFile, unwatchFile } from 'fs';
import cfonts from 'cfonts';
import { createInterface } from 'readline';
import yargs from 'yargs';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { say } = cfonts;
const rl = createInterface(process.stdin, process.stdout);

say('Admin-TK', {
  font: 'chrome',
  align: 'center',
  gradient: ['red', 'magenta']
});

say('by Joan TK', {
  font: 'console',
  align: 'center',
  gradient: ['red', 'magenta']
});

let isRunning = false;

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  const args = [join(__dirname, file), ...process.argv.slice(2)];

  cluster.setupMaster({
    exec: args[0],
    args: args.slice(1),
  });

  const p = cluster.fork();

  p.on('message', data => {
    console.log('[RECEIVED]', data);
    switch (data) {
      case 'reset':
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case 'uptime':
        p.send(process.uptime());
        break;
    }
  });

  p.on('exit', (code) => {
    isRunning = false;
    console.error('Ocurrió un error inesperado:', code);
    if (code === 0) return;
    watchFile(args[0], () => {
      unwatchFile(args[0]);
      start(file);
    });
  });

  let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
  if (!opts['test']) {
    if (!rl.listenerCount('line')) rl.on('line', line => {
      p.send(line.trim());
    });
  }
}

start('Admin-TK.js');
