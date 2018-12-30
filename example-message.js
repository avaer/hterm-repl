const htermRepl = require('.');

htermRepl((err, replServer) => {
  if (!err) {
    replServer.on('repl', r => {
      r.setEval((s, context, filename, cb) => {
        let err = null, result;
        try {
          result = eval(s);
        } catch (e) {
          err = e;
        }
        if (!err) {
          cb(null, result);
        } else {
          cb(err);
        }
      });
    });

    const connection = replServer.createConnection('http://127.0.0.1/connection?id=lol&protocol=message');
    connection.pipe(process.stdout);

    const m = JSON.stringify({
      method: 'c',
      args: 'process.version\n',
    });
    const mBuffer = Buffer.from(m, 'utf8');
    const messageArrayBuffer = new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT + mBuffer.byteLength);
    new Uint32Array(messageArrayBuffer, 0, 1)[0] = m.length;
    Buffer.from(messageArrayBuffer, Uint32Array.BYTES_PER_ELEMENT, mBuffer.byteLength).set(mBuffer);
    const messageBuffer = Buffer.from(messageArrayBuffer);
    connection.write(messageBuffer);
  } else {
    throw err;
  }
});
