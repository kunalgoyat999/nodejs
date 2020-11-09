const crypto = require('crypto'); 
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require(`./../models/userModel`);
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const Email = require('./../utilities/email')

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 *60 * 1000
        ), 
        httpOnly: true,
    };
    if(process.env.node_env === 'production') cookieOptions.secure = true;

    res.cookie('jwt', cookieOptions)

    // Remove password from output
    user.password = undefined;
    
    res.status(statusCode).json({
        status: 'success',
        token, 
        data: {
            users: user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordconfirm: req.body.passwordconfirm
    });
    // const newUser = await User.create(req.body);

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
});
 


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
  
    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
  
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
  
    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  });
  


exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
  
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verfication token

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);

    // 3) check if user still exists

    const freshUser = await User.findById(decoded.id);
    if(!freshUser) {
        return next(new AppError('The user belonging did not exist', 404))
    }

    // 4) check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decode.iat)) {
        return next(
            new AppError('User recently changed password! please log in again.', 401)
        )
    }

    // Grant Access to Protected Route
    req.user = freshUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide'].roles='user'
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        };
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) GET USER BASED ON POSTED EMAIL
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with email address.', 404));
    }
    // 2) GENERATE THE RANDOM  RESET TOKEN
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) SEND IT TO USER'S EMAIL
    

    const message = `Forgot your password? submit a PAtCH request with your new password and passwordCOnfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    
    
    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, restURL).sendPasswordReset();
    
    res.status(200).json({
        status: 'success',
        message: 'token sent to email'
    })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later!'), 500)
    }

});



exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires:{$gt: Date.now() }
});
    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.paswordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Update changePasswordAt property for the user
    // 4) log the user in, send JWT
    createSendToken(user, 200, res);

});

exports.updatePassword = catchAsync(async(req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if posted current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401))
    } 

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.asave();
    // User.findByIdAndUpdate will not work as intended!

    // 4) Log user in, send JWT 
});










