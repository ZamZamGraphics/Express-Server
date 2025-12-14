const getClientIp = (req) => {
  let ip = req.ip;

  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return ip || '';
};


module.exports = getClientIp;
