const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    mono: number
});

module.exports = mongoose.model("user", userSchema);
