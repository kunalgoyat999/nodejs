const crypto = require('crypto');
const mongoose = require('mongoose');

const validator = require('validator')
const bcrypt = require('bcryptjs');
// name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
    
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
    },
   email: {
       type: String,
       required: [true, 'Please provide your email'],
       unique: true,
       lowercase: true,
       validate: [validator.isEmail, 'Please provide a valid email']
   },
   photo: {
       type: String, 
       default: 'default.jpg' 
    },
   role: {
       type: String,
       enum: ['user', 'guide', 'lead-guide', 'admin'],
       defaut: 'user'
   },
   password: {
       type: String,
       required: [true, 'Please enter a password'],
       minlength: 8,
       select: false
   },
   passwordconfirm: {
       type: String,
       required: [true, 'Please enter a password'],
       validate: {
           //this only works on CREATE and SAVE!!!
           validator: function(el) {
               return el === this.password;
           },
           message: "message are not same"
       } 
   },
   passwordChangedAt: Date,
   passwordResetToken: String,
   passwordResetExpires: Date,
   active: {
     type: Boolean,
     default: true,
     select: true
   }
  });


  userSchema.pre('save', async function(next) {

    //only run this function if password was actually modified
      if(!this.isModified('password')) return next();

      //Hash the password with cost of 12
      this.password = await bcrypt.hash(this.password, 12);

      //delete passwordConfirm field
      this.passwordconfirm = undefined;
      next();

  });

  userSchema.pre('save', function(next) {
      if (!this.isModified('password') || this.isNew) return next();

      this.passwordChangedAt = Date.now() - 1000;
      next();
  });

  userSchema.pre(/^find/, function(next) {
    //this points to current querry
    this.find({active: {$ne: false} });
    next();
  });

  userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
      return await bcrypt.compare(candidatePassword, userPassword);
  }

  userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
      if(this.passwordChanedAt) {
          const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
          console.log(changedTimestamp, JWTTimestamp);
          return JWTTimestamp < changedTimestamp;
            }

      return false;
  }



  userSchema.methods.createPasswordResetToken = function() {
      const resetToken = crypto.randomBytes(32).toString('hex');

      this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      console.log({ resetToken }, this.passwordResetToken);

      this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

      return resetToken;
  }




 const User = mongoose.model('User', userSchema)
 

 module.exports = User;

