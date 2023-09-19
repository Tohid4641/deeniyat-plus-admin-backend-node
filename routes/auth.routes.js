const router = require('express').Router();
const { register, login, logout } = require('../controllers/auth.controller');
const { signupValidation, loginValidation, logoutValidation } = require('../helpers/validator');
const verifyToken = require('../middlewares/auth.middleware');


// REGISTER
router.post('/register', signupValidation, register);

// LOGIN
router.post('/login',loginValidation, login);

// LOGOUT
router.get('/logout/:user_id',  logout);

module.exports = router;