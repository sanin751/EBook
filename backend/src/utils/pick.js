
function pick(obj, keys) {
  const result = {};
  if (!obj) return result;
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}

module.exports = pick;
