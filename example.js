const htermRepl = require('.');

htermRepl({
  port: 8000,
}, (err, replServer) => {
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
  } else {
    throw err;
  }
});
