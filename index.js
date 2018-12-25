const stream = require('stream');
const http = require('http');
const repl = require('repl');
const express = require('express');
const ws = require('ws');

const port = process.env['PORT'] || 8000;

const app = express();
app.get('*', express.static(__dirname));

const wss = new ws.Server({
  noServer: true
});
wss.on('connection', ws => {
  const input = new stream.Readable();
  input._read = function() {
    // console.log('read');
    /* for (let i = 0; i < inputBuffers.length; i++) {
      this.push(inputBuffers[i]);
    }
    inputBuffers.length = 0; */
  };
  /* input.on('data', d => {
    console.log('input data', d);
  }); */
  const output = new stream.Writable();
  output._write = function(chunk, encoding, next) {
    if (encoding !== 'buffer') {
      chunk = Buffer.from(chunk, encoding);
    }
    ws.send(chunk);

    next();
  };
  /* input.on('data', d => {
    output.write(d);
  }); */
  const r = repl.start({
    prompt: '[x] ',
    input,
    output,
    terminal: true,
    useColors: true,
  });
  ws.on('message', m => {
    const j = JSON.parse(m);
    const {method, args} = j;
    switch (method) {
      case 'c': {
        input.push(args, 'utf8');
        break;
      }
      case 'resize': {
        console.log('resize', args);
        break;
      }
      default: {
        console.warn('unknown method', JSON.stringify(method));
      }
    }
  });
  /* r.on('data', d => {
    m.send(d);
  }); */
  // ws.pipe(r).pipe(ws);
});

const server = http.createServer(app);
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/repl') {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws);
    });
  } else {
    socket.destroy();
  }
});
server.listen(port);
