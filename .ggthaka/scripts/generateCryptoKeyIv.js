const generateCryptoKeyIv = async () => {
  const crypto = await import('node:crypto');
  const key = crypto.randomBytes(32).toString('hex');
  const iv = crypto.randomBytes(16).toString('hex');

  console.log('CRYPTO_KEY=' + "'" + key + "'");
  console.log('CRYPTO_IV=' + "'" + iv + "'");
};

generateCryptoKeyIv();
