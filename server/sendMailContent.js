// Import the Nodemailer library
import nodemailer from "nodemailer";
import "dotenv/config";

export const sendMailContent = async (content, recipientEmail) => {
    // Retrieve email credentials from environment variables
    const { EMAIL_USER, EMAIL_PASS } = process.env;

    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
        host: "vs-80.webhoster.ag", // Specify the email service's SMTP server
        port: 465, // Port for secure SMTP
        secure: true, // Indicates that this is a secure connection
        auth: {
            user: "tickets@agratamagatha.de", // Your email address
            pass: EMAIL_PASS, // Your email password, retrieved from environment variables
        },
    });

    // Define email data
    const mailOptions = {
        from: "tickets@agratamagatha.de", // Sender's email address
        to: recipientEmail, // Recipient's email address
        subject: "AgratAmAgatha Überweisungsdetails", // Email subject
        html: content, // Email body text
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error); // Log any errors
        } else {
            console.log("Email sent:", info.response); // Log the successful email response
        }
    });
};