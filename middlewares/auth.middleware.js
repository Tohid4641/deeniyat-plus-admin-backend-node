const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  const accessToken = req.headers.accesstoken;

  if (!accessToken) {
    return res.status(403).send("A token is required for authentication");
  };
  try {
    const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Unauthorized! or Invalid Token");
  };
  return next();
};

module.exports = verifyToken;
