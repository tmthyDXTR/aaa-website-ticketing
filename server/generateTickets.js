import PDFDocument from "pdfkit";
import qr from "qrcode";
import fs from "fs";
import path from "path";
import mysql from "mysql";
import "dotenv/config";
import { queryAsync } from "../js/utils.js";

// Function to generate a ticket based on an array of tickets input
export const generateTickets = async (sqlrows) => {
    // SQL connection
    const { SQL_HOST, SQL_DB_NAME, SQL_USER_NAME, SQL_USER_PASSWORD } =
        process.env;
    const con = mysql.createConnection({
        host: SQL_HOST,
        user: SQL_USER_NAME,
        password: SQL_USER_PASSWORD,
        database: SQL_DB_NAME,
    });

    // Connect to the database
    await new Promise((resolve, reject) => {
        con.connect((err) => {
            if (err) reject(err);
            else {
                console.log("generateTickets Connected!");
                resolve();
            }
        });
    });

    try {
        console.log("Generate tickets");
        if (!sqlrows || !Array.isArray(sqlrows)) {
            throw new Error("Invalid input for ticket generation");
        }

        const ticketLinks = {};

        // Create an array of promises for each ticket generation and update
        const ticketGenerationPromises = sqlrows.map(
            async (ticketData, index) => {
                return new Promise(async (resolve, reject) => {
                    // Load the PNG image
                    const imageFilePath = "./img/aaa-ticket-blanco.jpg"; // Replace with your input image path

                    // Create a PDF document
                    const doc = new PDFDocument({ size: [154, 452] });
                    doc.image(imageFilePath, 0, 0, {
                        width: doc.page.width,
                        height: doc.page.height,
                    });

                    // Define file paths
                    const filePath = `./tickets/AAA_${
                        ticketData.ticket_paypal_id
                    }_${index + 1}_${ticketData.ticket_security_code}_${
                        ticketData.ticket_name
                    }.pdf`;
                    doc.pipe(fs.createWriteStream(filePath)); // write to PDF
                    const qrCodePath = `./tickets/qrcode_${index + 1}.png`;

                    // Generate QR code
                    const dataToEncode =
                        ticketData.ticket_type +
                        "-" +
                        ticketData.ticket_security_code;
                    const qrCodeOptions = {
                        errorCorrectionLevel: "H",
                        type: "png",
                        quality: 0.92,
                        margin: 1,
                    };

                    // Promisify the QR code generation
                    try {
                        await new Promise((qrResolve, qrReject) => {
                            qr.toFile(
                                qrCodePath,
                                dataToEncode,
                                qrCodeOptions,
                                (err) => {
                                    if (err) qrReject(err);
                                    else qrResolve();
                                }
                            );
                        });
                    } catch (qrError) {
                        reject(qrError);
                        return;
                    }

                    // Add content to the PDF
                    doc.fontSize(18);
                    doc.registerFont("PTMono", "./fonts/PTM55F.ttf");
                    doc.font("PTMono");
                    const ticketType = ticketData.ticket_name.toUpperCase();
                    const ticketPrice = `${ticketData.ticket_price} €`;
                    const ticketCode =
                        ticketData.ticket_type +
                        "-" +
                        ticketData.ticket_security_code;

                    // Draw a text cell with specified position and width
                    doc.text(ticketType, 15, 255, {
                        width: 140,
                        align: "left", // Text alignment within the cell: 'left', 'right', 'center', or 'justify'
                        valign: "top", // Vertical alignment within the cell: 'top', 'center', or 'bottom'
                    });

                    doc.text(ticketPrice, 90, 300, {
                        width: 50,
                        align: "right", // Text alignment within the cell: 'left', 'right', 'center', or 'justify'
                        valign: "top", // Vertical alignment within the cell: 'top', 'center', or 'bottom'
                    });

                    doc.text(ticketCode, 15, 343, {
                        width: 140,
                        align: "left", // Text alignment within the cell: 'left', 'right', 'center', or 'justify'
                        valign: "top", // Vertical alignment within the cell: 'top', 'center', or 'bottom'
                    });

                    // Embed the QR code into the PDF
                    doc.image(qrCodePath, 45, 376, { width: 62, height: 62 });

                    // Finalize the PDF
                    doc.end();

                    // Delete the QR code file after it's embedded
                    fs.unlinkSync(`./tickets/qrcode_${index + 1}.png`);

                    // Resolve the promise with the ticket link
                    const fullPath = path.resolve(filePath);
                    ticketLinks[index] = {
                        securityCode: ticketData.ticket_security_code,
                        url: fullPath,
                    };
                    resolve(fullPath);
                });
            }
        );

        // Wait for all ticket generation and updates to complete
        const generatedTicketPaths = await Promise.all(
            ticketGenerationPromises
        );

        // Update the database with ticket URLs
        for (const key in ticketLinks) {
            if (ticketLinks.hasOwnProperty(key)) {
                const ticket = ticketLinks[key];
                const securityCode = ticket.securityCode;
                const url = ticket.url;

                // Update the database using the promisified query method
                const updateQuery =
                    "UPDATE aaa_tickets_24 SET ticket_url = ? WHERE ticket_security_code = ?";
                try {
                    await queryAsync(con, updateQuery, [url, securityCode]);
                    console.log(
                        `Updated ticket URL for security code ${securityCode}`
                    );
                } catch (updateError) {
                    console.error("Error updating rows:", updateError);
                }
            }
        }

        return generatedTicketPaths;
    } catch (error) {
        console.error("Ticket generation failed:", error);
    }
};
