const { verify } = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  verify(token, getKey, {
    issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    algorithms: ['RS256'],
  }, (err, decoded) => {
    if (err) {
      console.error(err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (decoded.token_use !== 'access') {
        return res.status(401).json({ error: 'Invalid token type' });
    }
    req.user = decoded;
    next();
  });
}

module.exports = {verifyToken}