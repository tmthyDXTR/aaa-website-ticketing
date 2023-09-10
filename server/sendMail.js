// Import the Nodemailer library
import nodemailer from 'nodemailer';
import mysql from "mysql";
import "dotenv/config";

export const sendMail = async (orderId, customEmail=null) => {
    if (orderId === null || orderId === undefined) throw error;
    
    
    // sql
    const { SQL_HOST, SQL_DB_NAME, SQL_USER_NAME, SQL_USER_PASSWORD  } = process.env;
    var con = mysql.createConnection({
        host: SQL_HOST,
        user: SQL_USER_NAME,
        password: SQL_USER_PASSWORD,
        database: SQL_DB_NAME,
    });
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
    });
      
    // Retrieve the email password from environment variables
    const { EMAIL_PASS } = process.env;
    
    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
        host: 'vs-80.webhoster.ag', // Specify the email service's SMTP server
        port: 465, // Port for secure SMTP
        secure: true, // Indicates that this is a secure connection
        auth: {
            user: 'tickets@agratamagatha.de', // Your email address
            pass: EMAIL_PASS, // Your email password, retrieved from environment variables
        },
    });

    var recipientMail;
    const query = `SELECT * FROM aaa_tickets_24 WHERE ticket_order_id = ?`;
      con.query(query, [orderId], (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          return;
        }
        recipientMail = results[0].ticket_holder_email;
        console.log(recipientMail);

        var tickets = [];
        for (const ticket of results) {
            const parts = ticket.ticket_url.split('\\');
            // Use the pop function to get the last part of the array (everything after the last slash)
            const title = parts.pop();            

            tickets.push({
                filename: title,
                path: ticket.ticket_url
            })
        }
        var mailText = ticketMailContent;
        if (results.length > 1) {
            mailText = ticketMailContentMulti;
        }

        console.log(tickets);
        // Define email data
        const mailOptions = {
            from: 'tickets@agratamagatha.de', // Sender's email address
            to: recipientMail, // Recipient's email address
            subject: 'AgratAmAgatha Ticketmail', // Email subject
            text: mailText, // Email body text
            attachments: tickets,
        };
        
        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error); // Log any errors
            } else {
                console.log('Email sent:', info.response); // Log the successful email response
            }
        });
    });
} 


var ticketMailContent = `Hallo! Hier dein Ticket.
Wir sehen uns am See!
Liebe Grüße, das AAA-Team :)`;
var ticketMailContentMulti = `Hallo! Hier sind deine Tickets.
Wir sehen uns am See!
Liebe Grüße, das AAA-Team :)`;

// For testing
// const orderId = 150;
// sendMail(orderId);