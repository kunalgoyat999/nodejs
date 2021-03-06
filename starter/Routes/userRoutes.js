const express = require('express')
const userController = require('./../Controllers/userController')
const authController = require('./../Controllers/authController')


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword); 
router.patch('/resetPassword/:token', authController.resetPassword); 

router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get(
    '/me',
    userController.getMe,
    userController.getUser
    );
    
router.patch('/updateMe', userController.uploadUserPhoto, userController.updateMe);
router.delete('/deleteMe',  userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
.route(`/`) 
.get(userController.getallUsers)
.post(userController.createuser);

router
.route('/:id')
.get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);


module.exports = router
