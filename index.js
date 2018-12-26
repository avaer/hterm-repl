const events = require('events');
const {EventEmitter} = events;
const stream = require('stream');
const http = require('http');
const repl = require('repl');
const express = require('express');
const ws = require('ws');

const DEFAULT_PORT = 9223;

module.exports = ({port = DEFAULT_PORT}) => {
  const app = express();
  app.get('*', express.static(__dirname));

  const wss = new ws.Server({
    noServer: true
  });
  const _makeRepl = (ws, spec) => {
    let live = true;

    const input = new stream.Readable();
    input._read = function() {};
    const output = new stream.Writable();
    output._write = function(chunk, encoding, next) {
      if (encoding !== 'buffer') {
        chunk = Buffer.from(chunk, encoding);
      }
      ws.send(chunk);

      next();
    };
    const _makeInstance = () => repl.start({
      prompt: '[x] ',
      input,
      output,
      eval(s, context, filename, cb) {
        localEval(s, context, filename, cb);
      },
      global: true,
      terminal: true,
      useColors: true,
    });
    const _bindInstance = r => {
      r.on('exit', () => {
        if (live) {
          r = _makeInstance();
          _bindInstance(r);
        }
      });
    };
    let r = _makeInstance();
    _bindInstance(r);
    ws.on('message', m => {
      const j = JSON.parse(m);
      const {method, args} = j;
      switch (method) {
        case 'c': {
          input.push(args, 'utf8');
          break;
        }
        case 'resize': {
          // console.log('resize', args); // XXX
          break;
        }
        default: {
          console.warn('unknown method', JSON.stringify(method));
        }
      }
    });
    ws.on('close', () => {
      live = false;
      r.close();
    });

    let localEval = () => {};
    return {
      setEval(newEval) {
        localEval = newEval;
      },
      close() {
        ws.close();
      },
    };
  };

  const server = http.createServer(app);
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
      const r = _makeRepl(ws);
      r.url = request.url;
      replServer.emit('repl', r);
    });
  });
  server.listen(port);

  const replServer = new EventEmitter();
  return replServer;
};
