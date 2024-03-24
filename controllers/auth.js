const User = require('../models/User');

// @desc    Register user
// @route   POST/api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        //Extracting the data from the request body
        const {name , email, password, role , tel} = req.body;
        const user = await User.create({
            name,
            email,
            password,
            role,
            tel
        });
        //Send the token
        sendTokenResponse(user, 200, res);

    } catch (err) {
        //If there is an error for example the user already exists, send a 400 status code
        res.status(400).json({success: false});
        console.log(err.stack);
    }
}

// @desc    Login user
// @route   POST/api/auth/login
// @access  Public
exports.login = async (req, res, next) => {

    try {
         //Extracting the data from the request body
        const {email, password} = req.body;

        //Check if the email and password are provided
        if(!email || !password) {
            return res.status(400).json({success: false, msg: 'Please provide email and password'});
        }

        //Check if the user exists
        const user = await User.findOne({email}).select('+password');

        if(!user) {
            return res.status(400).json({success: false, msg: 'Invalid credentials'});
        }

        const isMatch = await user.matchPassword(password);
        if(!isMatch) {
            return res.status(401).json({success: false, msg: 'Invalid credentials'});
        }
        sendTokenResponse(user, 200, res);
        
    } catch (error) {
        return res.status(401).json({success: false, msg: 'Cannot convert email or password to string'});
    }
   
}

const sendTokenResponse = (user, statusCode, res) => {

    //Create token
    const token = user.getSignedJwtToken();

    //Set the cookie options
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({success: true, token});
}

// @desc    Get current logged in user
// @route   POST/api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {

    //Get the user from the database
    const user = await User.findById(req.user.id);
    res.status(200).json({success: true, data: user});
}

exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({success: true, data: {}});
}