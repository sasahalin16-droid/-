
const nodemailer = require('nodemailer');
// Настрой здесь свои данные, если хочешь реальные письма
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'test@gmail.com', pass: 'test' }
});
const sendEmail = async (to, subject, html) => {
    // console.log('Mail to:', to); // Раскомментируй для дебага
};
module.exports = sendEmail;
