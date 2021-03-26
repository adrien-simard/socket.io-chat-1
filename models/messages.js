var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

    

var MessageSchema = new Schema({
    content: {type:String,required: true},
});

module.exports = mongoose.model('message', MessageSchema);