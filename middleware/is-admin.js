
module.exports = (req, res, next) => {
    
    if (req.session.user.email != 'ahmed1@gmail.com') {
        return res.status(403).render('access', {
            pageTitle: 'Access denied!',
            path: '/access',
            isAuthenticated: req.session.isLoggedIn
        });
    } 
next();
};

