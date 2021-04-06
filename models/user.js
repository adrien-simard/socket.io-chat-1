var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    

var UserSchema = new Schema({
    username: {type: String, lowercase: true, index: true},
   
});

module.exports = mongoose.model('user', UserSchema);