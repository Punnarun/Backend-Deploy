// Import mongoose
const mongoose = require('mongoose');

// Create Schema
const DentistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    yearsOfExperience: {
        type: Number,
        required: [true, 'Please add years of experience']
    },
    areaOfExpertise: {
        type: String,
        required: [true, 'Please add an area of expertise']
    }
    } , {
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
);

DentistSchema.virtual('bookings',{
    ref: 'Booking',
    localField: '_id',
    foreignField: 'dentist',
    justOne: false
});

DentistSchema.pre('deleteOne', {document: true, query: false}, async function (next) {
    console.log(`Bookings being removed from dentist ${this._id}`);
    await this.model('Booking').deleteMany({dentist: this._id});
    next(); 
});

module.exports = mongoose.model('Dentist', DentistSchema);
