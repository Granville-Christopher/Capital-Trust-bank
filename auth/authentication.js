const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    if (roles.length && !roles.includes(req.session.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: Insufficient permissions." });
    }

    req.user = req.session.user;
    next();
  };
};

module.exports = authMiddleware;
