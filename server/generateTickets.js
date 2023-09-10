import PDFDocument from 'pdfkit';
import qr from 'qrcode';
import fs from 'fs';
import path from 'path';

// Function to generate a ticket based on array of tickets input
export const generateTickets = async (sqlrows) => {
    console.log("Generate tickets");
    if (sqlrows === null || sqlrows === undefined) return Promise.resolve([]);
    var ticketLinks = {};

    // Create an array of promises for each ticket generation
    const ticketGenerationPromises = sqlrows.map(async (ticketData, index) => {
        return new Promise(async (resolve) => {
            // Load the PNG image
            const imageFilePath = './img/aaa-ticket-blanco.png'; // Replace with your input image path
            
            // Passing size to the constructor
            const doc = new PDFDocument({size: [154,452]});

            doc.image(imageFilePath, 0,0, {width: doc.page.width, height: doc.page.height});

            const filePath = `./tickets/AAA_${ticketData.ticket_paypal_id}_${index + 1}_${ticketData.ticket_security_code}_${ticketData.ticket_name}.pdf`;
            doc.pipe(fs.createWriteStream(filePath)); // write to PDF
            const fullPath = path.resolve(filePath);
            ticketLinks[index] = {  "securityCode": ticketData.ticket_security_code,
                                    "url": fullPath };
            // add stuff to PDF
            doc.fontSize(18);
            // Using PDF font

            // Register a font
            doc.registerFont('PTMono', './fonts/PTM55F.ttf');
            doc.font('PTMono')

            // Customize ticket content based on the ticketData object
            const ticketType = ticketData.ticket_name.toUpperCase();
            const ticketPrice = `${ticketData.ticket_price} €`;
            const ticketCode = ticketData.ticket_type + "-" + ticketData.ticket_security_code;

            // Draw a text cell with specified position and width
            doc.text(ticketType, 15, 255, {
                width: 140,
                align: 'left', // Text alignment within the cell: 'left', 'right', 'center', or 'justify'
                valign: 'top', // Vertical alignment within the cell: 'top', 'center', or 'bottom'
            });

            doc.text(ticketPrice, 90, 300, {
                width: 50,
                align: 'right', // Text alignment within the cell: 'left', 'right', 'center', or 'justify'
                valign: 'top', // Vertical alignment within the cell: 'top', 'center', or 'bottom'
            });

            doc.text(ticketCode, 15, 343, {
                width: 140,
                align: 'left', // Text alignment within the cell: 'left', 'right', 'center', or 'justify'
                valign: 'top', // Vertical alignment within the cell: 'top', 'center', or 'bottom'
            });


            // Data to be encoded as a QR code
            const dataToEncode = ticketCode; // Replace with your data

            // Options for QR code generation (optional)
            const qrCodeOptions = {
                errorCorrectionLevel: 'H', // Error correction level: L, M, Q, H (default: 'L')
                type: 'png', // Output format: png, svg, utf8, etc. (default: 'utf8')
                quality: 0.92, // Image quality (default: 0.92)
                margin: 1, // Margin around the QR code (default: 4)
            };

            // Generate the QR code
            qr.toFile(`./tickets/qrcode_${index + 1}.png`, dataToEncode, qrCodeOptions, (err) => {
                if (err) throw err;
                // console.log(`QR code saved as qrcode_${index + 1}.png`);
                
                // Embed the QR code into the PDF
                doc.image(`./tickets/qrcode_${index + 1}.png`, 45, 376, { width: 62, height: 62 });

                // Finalize the PDF and end the stream for this ticket
                doc.end();

                // Delete the QR code file after it's embedded
                fs.unlinkSync(`./tickets/qrcode_${index + 1}.png`);
                // console.log(`QR code deleted: qrcode_${index + 1}.png`);
                // console.log(ticketLinks);
            });
            // Resolve the promise with the ticket link
            resolve(fullPath);
        });
    });
    // Wait for all ticket generation promises to resolve
    return Promise.all(ticketGenerationPromises).then(() => {
        return ticketLinks;
    });
}
