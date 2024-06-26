const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookDate: {
        type: Date,
        required: [true, 'Please add a booking date']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    dentist: {
        type: mongoose.Schema.ObjectId,
        ref: 'Dentist',
        required: true
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    username: {
        type: String,
        required: [true, 'Please add a username']
    },
    dentistname: {
        type: String,
        required: [true, 'Please add a dentistname']
    }
}); 

module.exports = mongoose.model('Booking', BookingSchema);
