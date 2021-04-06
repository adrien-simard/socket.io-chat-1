var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const User = require('./user');


    

var MessageSchema = new Schema({
    content: {type:String,required: true},
    utilisateur: String,
});

module.exports = mongoose.model('message', MessageSchema);