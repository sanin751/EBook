// express-mongo-sanitize reassigns req.query/req.body wholesale, which
// throws under Express 5 (req.query is a getter-only accessor there). This
// does the same NoSQL-injection stripping ($-prefixed keys / dotted keys)
// by mutating each object in place instead of reassigning it.
function stripDangerousKeys(value) {
  if (value === null || typeof value !== 'object') return;

  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
      continue;
    }
    stripDangerousKeys(value[key]);
  }
}

module.exports = function sanitizeInputs(req, res, next) {
  stripDangerousKeys(req.body);
  stripDangerousKeys(req.params);
  stripDangerousKeys(req.query);
  next();
};
