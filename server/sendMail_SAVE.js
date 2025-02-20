// Import the Nodemailer library
import nodemailer from "nodemailer";
import mysql from "mysql";
import "dotenv/config";
import { queryAsync } from "../js/utils.js";
import puppeteer from 'puppeteer';
import fs from "fs";
import path from "path";



export const sendMail = async (orderId, customEmail = null) =>
{
    if (orderId === null || orderId === undefined) throw error;
    console.log("sendMail order Id: " + orderId);
    console.log("sendMail email: " + customEmail);

    // sql
    const { SQL_HOST, SQL_DB_NAME, SQL_USER_NAME, SQL_USER_PASSWORD } =
        process.env;
    var con = mysql.createConnection({
        host: SQL_HOST,
        user: SQL_USER_NAME,
        password: SQL_USER_PASSWORD,
        database: SQL_DB_NAME,
    });
    con.connect(function (err)
    {
        if (err) throw err;
        console.log("sendMail Connected!");
    });

    // Retrieve the email password from environment variables
    const { EMAIL_PASS } = process.env;

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

    var recipientMail;
    const query = `SELECT * FROM aaa_tickets_25 WHERE ticket_order_id = ?`;
    con.query(query, [orderId], (err, results) =>
    {
        if (err)
        {
            console.error("Error executing query:", err);
            return;
        }
        recipientMail = results[0].ticket_holder_email;
        if (customEmail) recipientMail = customEmail;
        console.log("sendmail data:");
        results.forEach((row, index) =>
        {
            console.log(`Row ${index + 1}:`);
            console.table(Object.entries(row));
            console.log('\n'); // Add a new line for better separation
        });

        var tickets = [];
        for (const ticket of results)
        {
            const parts = ticket.ticket_url.split(/[\/\\]/);
            // Use the pop function to get the last part of the array (everything after the last slash)
            const title = parts.pop();

            tickets.push({
                filename: title,
                path: ticket.ticket_url,
            });
        }
        var mailText = ticketMailContent;
        if (results.length > 1)
        {
            mailText = ticketMailContentMulti;
        }


        generateInvoicePDF(results, orderId).then((pdfBuffer) =>
        {
            let mailTextInvoice = generateInvoiceHTML(results, orderId);
            // Save PDF to /rechnungen/ directory
            const pdfFileName = `AAA24_Rechnung_${formatInvoiceDate(new Date())}_${orderId}.pdf`;
            const pdfFilePath = path.join('./rechnungen', pdfFileName);

            fs.writeFileSync(pdfFilePath, pdfBuffer);

            console.log('Invoice PDF saved to:', pdfFilePath);


            // Use the generated pdfBuffer as needed (e.g., save to a file or send in an email)
            const mailOptionsInvoice = {
                from: "tickets@agratamagatha.de", // Sender's email address
                to: recipientMail, // Recipient's email address
                subject: "AgratAmAgatha Rechnung", // Email subject
                html: mailTextInvoice, // Email body text
                attachments: [
                    {
                        filename: 'AAA24_Rechnung' + formatInvoiceDate(new Date()) + '.pdf',
                        content: pdfBuffer,
                        encoding: 'base64', // Make sure to include the encoding
                    },
                ],
            };
            transporter.sendMail(mailOptionsInvoice, (error, info) =>
            {
                if (error)
                {
                    console.error("Error sending email:", error); // Log any errors
                } else
                {

                    console.log("Invoice sent:", info.response); // Log the successful email response
                }
            });
        });

        console.log(tickets);
        // Define email data
        const mailOptions = {
            from: "tickets@agratamagatha.de", // Sender's email address
            to: recipientMail, // Recipient's email address
            subject: "AgratAmAgatha Ticketmail", // Email subject
            text: mailText, // Email body text
            attachments: tickets,
        };



        // Send email
        transporter.sendMail(mailOptions, (error, info) =>
        {
            if (error)
            {
                console.error("Error sending email:", error); // Log any errors
            } else
            {
                const updateQuery =
                    "UPDATE aaa_tickets_25 SET ticket_sent_time = ? WHERE ticket_order_id = ?";
                try
                {
                    queryAsync(con, updateQuery, [
                        new Date().toISOString().slice(0, 19).replace("T", " "),
                        orderId,
                    ]);
                    console.log(`Updated ticket sent time for ${orderId}`);
                } catch (updateError)
                {
                    console.error(
                        "Error updating rows for ticket sent time:",
                        updateError
                    );
                }
                console.log("Email sent:", info.response); // Log the successful email response
            }
        });


    });
};

var ticketMailContent = `Hallo! Hier dein Ticket.
Wir sehen uns am See!
Liebe Grüße, das AAA-Team :)`;
var ticketMailContentMulti = `Hallo! Hier sind deine Tickets.
Wir sehen uns am See!
Liebe Grüße, das AAA-Team :)`;


function generateInvoiceHTML(rows, orderId)
{
    let totalAmount = 0;

    // Generate HTML for individual rows
    const rowsHTML = rows.map((row, index) =>
    {
        totalAmount += row.ticket_price;

        return `
          <tr>
              <td>${row.ticket_type}</td>
              <td>${row.ticket_name}</td>
              <td>${row.ticket_price.toFixed(2)} €</td>
          </tr>
      `;
    }).join('');

    // Calculate VAT percentage
    const vatPercentage = 7; // Change this if the VAT rate is different

    // Generate HTML for the entire invoice
    const invoiceHTML = `
<html>
<head>
  <style>
    body {
        font-family: 'Courier New', Courier, monospace;
        margin: 40px;
    }
    .invoice-header {
      text-align: center;
      margin-bottom: 20px;
    }
    .invoice-details {
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    .invoice-total {
      text-align: right;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>AgratAmAgatha 2025 | 25-27 Juli</h1>
    <h2>Rechnung</h2>
  </div>
  <div class="invoice-details">
    <p><strong>Rechnungsaussteller:</strong> Kultureller Untergrund Riedenburg e.V.</p>
    <p><strong>Straße:</strong> Kelheimwinzerstr. 69</p>
    <p><strong>Stadt:</strong> 93309 Kelheim</p>
    <p><strong>Vereinsregister:</strong> VR 70566</p>
    <p><strong>Registergericht:</strong> Amtsgericht Regensburg</p>
    <p><strong>Umsatzsteuer-ID:</strong> DE268290552</p><br>
    <p><strong>Rechnungsdatum:</strong> ${formatInvoiceDate(new Date())}</p>
    <p><strong>Lieferdatum:</strong> ${formatInvoiceDate(new Date())}</p>
    <p><strong>Rechnungsnummer:</strong> ${parseInt(orderId) + 1000}</p>
    <!-- Add other details as needed -->
  </div>
  <table class="invoice-items">
    <thead>
      <tr>
        <th>Artikel</th>
        <th>Beschreibung</th>
        <th>Preis</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>
  <div class="invoice-total">
    <p><strong>MwSt (${vatPercentage}%):</strong> ${(totalAmount * (vatPercentage / 100)).toFixed(2)} €</p>
    <p><strong>Gesamt:</strong> ${totalAmount.toFixed(2)} €</p>
  </div>
</body>
</html>
`;

    return invoiceHTML;
}

function formatInvoiceDate(date)
{
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('de-DE', options);
}

async function generateInvoicePDF(rows, orderId)
{
    const invoiceHTML = generateInvoiceHTML(rows, orderId);

    // Launch a headless browser with Puppeteer
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--disable-setuid-sandbox', '--no-sandbox'],
        ignoreDefaultArgs: ['--disable-extensions'], 

    });
    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(invoiceHTML);

    // Generate PDF from the HTML content
    const pdfBuffer = await page.pdf({ format: 'A4' });

    // Close the browser
    await browser.close();

    // Return the PDF buffer
    return pdfBuffer;
}

// If called on command line
const args = process.argv.slice(2); // Get command-line arguments excluding 'node' and 'your-module.js'
if (args.length > 0)
{
    const id = args[0];
    const email = args[1];
    sendMail(id, email);
} else
{
    console.log("sendMail.js start: no parameter given");
}
