const express = require('express');

const controllers = require('./../controllers/userContrllers');
const authController = require('./../controllers/authController');

const router = express.Router();

// *) In Some special cases we can create some
// end point that do not 100% fit in rest Rules
router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/getMe', controllers.getMe, controllers.getUser);
router.patch('/updateMe', controllers.uploadUserPhoto, controllers.resizeUserPhoto, controllers.updateMe);
router.delete('/deleteMe', controllers.deleteMe);
// No particular reason to put "updateMe" in "controllers" and not "authController"
// It's typical to put update password function related in on file("authControllers") and
// update user data in another("controllers")


// *) Here These all follow rest, because :
// where the name of URL has nothing to do with
// the action that is performed while in above('/sighup') it has


router.use(authController.restrictTo('admin'));

router.route('/')
  .get(controllers.getAllUsers)
  .post(controllers.createUser);

router.route('/:id')
  .get(controllers.getUser)
  .patch(controllers.updateUser)
  .delete(controllers.deleteUser);

module.exports = router;