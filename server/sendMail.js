// Import the Nodemailer library
import nodemailer from 'nodemailer';
import mysql from "mysql";
import "dotenv/config";
import { queryAsync } from "../js/utils.js";

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
        console.log("sendMail Connected!");
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
            const parts = ticket.ticket_url.split(/[\/\\]/);
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
                const updateQuery = 'UPDATE aaa_tickets_24 SET ticket_sent_time = ? WHERE ticket_order_id = ?';
                try {
                    queryAsync(con, updateQuery, [new Date().toISOString().slice(0, 19).replace('T', ' '), orderId]);
                    console.log(`Updated ticket sent time for ${orderId}`);
                } catch (updateError) {
                    console.error('Error updating rows for ticket sent time:', updateError);
                }
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



// If called on command line
const args = process.argv.slice(2); // Get command-line arguments excluding 'node' and 'your-module.js'
if (args.length > 0) {
  const id = args[0];
  sendMail(id);
} else {
  console.log('sendMail.js start: no parameter given');
}