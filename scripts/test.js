const mongoose = require('mongoose');

console.log('heylo');

mongoose.connect('mongodb://127.0.0.1:27017/weebsiteDB')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));