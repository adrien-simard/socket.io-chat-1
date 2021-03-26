var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    

var UserSchema = new Schema({
    username: {type: String, lowercase: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true},
   
});

module.exports = mongoose.model('user', UserSchema);