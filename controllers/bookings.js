const Dentist = require('../models/Dentist');
const Booking = require('../models/Booking');
const dotenv = require('dotenv');
const sgMail = require('@sendgrid/mail');
dotenv.config({ path: './config/config.env'});
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// console.log(process.env.SENDGRID_API_KEY);

// @desc    Get all bookings
// @route   GET/api/bookings
// @access  Public
exports.getBookings = async (req, res, next) => {
    let query;
    if (req.user.role !== 'admin') {
        query = Booking.find({user: req.user.id}).populate({
            path: 'dentist',
            select: 'name yearOfExperience areaOfExpertise'
        });
    }
    else {
        if(req.params.dentistId) {
            console.log(req.params.dentistId);
            query = Booking.find({dentist: req.params.dentistId}).populate({
                path: 'dentist',
                select: 'name yearOfExperience areaOfExpertise'
            });
        }
        else {
            query = Booking.find().populate({
                path: 'dentist',
                select: 'name yearOfExperience areaOfExpertise'
            });
        }
    }
    try{
        const bookings = await query;
        res.status(200).json({success: true, count: bookings.length, data: bookings});
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({success:false, message:"Cannot find bookings"});
    }
};

exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'dentist',
            select: 'name yearOfExperience areaOfExpertise'
        });

        if (!booking) {
            return res.status(404).json({ success: false , message: `No booking with the id of ${req.params.id}` });
        }
        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Cannot find booking' });
    }
}

// @desc    Create new appointment
// @route   POST /api/v1/hospitals/:hospitalId/appointments
// @access  Private
exports.addBooking=async (req,res,next)=>{
    try{
        req.body.dentist=req.params.dentistId;
        const dentist = await Dentist.findById(req.params.dentistId);
        
        if(!dentist){
            return res.status(404).json({ success:false, message:`No dentists with the id of ${req.params.dentistId}`});
        }

        req.body.user=req.user.id;
        const Booked = await Booking.find({user:req.user.id});
        
        //Change to 1 according to requirement
        if(Booked.length >= 1 && req.user.role !== 'admin'){
            return res.status(400).json({ success: false, message: `User : ${req.user.id} has already made an booking`});
        }

        const booking = await Booking.create(req.body);
        sgMail.send(generateEmailMessage('create', booking));
        res.status(200).json({ success:true, data: booking });

    }catch(error){
        console.log(error);
        return res.status(500).json({ success:false, message:"Cannot create Booking" });
    }
}


exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        // Make sure user is appointment owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        sgMail.send(generateEmailMessage('update', booking));
        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Cannot update booking' });
    }
}

exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        // Make sure user is appointment owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
        }
        await booking.deleteOne();
        sgMail.send(generateEmailMessage('delete', booking));
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Cannot delete booking' });
    }
}

const generateEmailMessage = (action, booking) => {
    let subject, introText;

    if (action === 'create') {
        subject = 'Booking Confirmation';
        introText = 'Thank you for making a booking with our dentist.';
    } else if (action === 'update') {
        subject = 'Update Confirmation';
        introText = 'Thank you for updating your booking with our dentist.';
    } else if (action === 'delete') {
        subject = 'Cancellation Confirmation';
        introText = 'We regret to inform you that your booking has been canceled.';
    }

    const bookingDetailsHTML = action === 'create' ? `
        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0;"><strong>Your Booking Details:</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Field</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Value</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${booking.bookDate}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Dentist</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${booking.dentist}</td>
                </tr>
            </table>
        </div>
    ` : '';

    return {
        to: 'Punnarunwork@gmail.com', // Use the user's email address
        from: 'Punnarunwork@gmail.com',
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #007BFF;">${subject}</h2>
                <p>Dear Customer,</p>
                <p>${introText}</p>
                
                ${bookingDetailsHTML}
                
                <p style="margin-top: 20px;">We appreciate your trust in our services.</p>
                <p>Best regards,<br>Mongkol Dental Clinic Team</p>
            </div>
        `
    };
};