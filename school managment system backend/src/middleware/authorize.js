/**
 * authorize(...roles) — only users whose role is in the list may proceed.
 * Usage: router.get('/route', authenticate, authorize('admin', 'teacher'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required." });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "You do not have permission to access this resource." });
  }
  next();
};

module.exports = authorize;
