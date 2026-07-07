const getClientIp = (req) => {
  // Cloudflare সবসময় real client IP এই header এ পাঠায়, সবচেয়ে নির্ভরযোগ্য
  let ip = req.headers['cf-connecting-ip'];

  // fallback: Cloudflare না থাকলে বা header miss হলে
  if (!ip) {
    ip = req.ip;
  }

  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return ip || '';
};


module.exports = getClientIp;
