// middleware/auth.js
module.exports = function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.status(403).render('error', { message: 'No tienes permiso o no estás logeado' });
    }
};


