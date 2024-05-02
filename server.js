import express, { json } from "express";
import fetch from "node-fetch";
import "dotenv/config";
import path from "path";
import mysql from "mysql";
import { generateTickets } from "./server/generateTickets.js";
import { sendMail } from "./server/sendMail.js";
import { sendMailContent } from "./server/sendMailContent.js";
import { createOrderSQL } from "./server/createOrderSQL.js";
import {
    calculateTotalPrice,
    generateTicketTableFromCart,
} from "./js/utils.js";
import { promises } from "fs";

import multer from 'multer';
const upload = multer({ dest: 'video-uploads/' });


const {
    IS_PRODUCTION,
    PAYPAL_CLIENT_ID_TEST,
    PAYPAL_CLIENT_SECRET_TEST,
    PAYPAL_CLIENT_ID_LIVE,
    PAYPAL_CLIENT_SECRET_LIVE,
    PORT = process.env.PORT || 3000,
} = process.env;

const PAYPAL_CLIENT_ID =
    IS_PRODUCTION === "true" ? PAYPAL_CLIENT_ID_LIVE : PAYPAL_CLIENT_ID_TEST;
const PAYPAL_CLIENT_SECRET =
    IS_PRODUCTION === "true"
        ? PAYPAL_CLIENT_SECRET_LIVE
        : PAYPAL_CLIENT_SECRET_TEST;

const base =
    IS_PRODUCTION === "true"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

const app = express();

console.log("Try to establish SQL connection");

// sql
const { SQL_HOST, SQL_DB_NAME, SQL_USER_NAME, SQL_USER_PASSWORD } = process.env;

var con = mysql.createConnection({
    host: SQL_HOST,
    user: SQL_USER_NAME,
    password: SQL_USER_PASSWORD,
    database: SQL_DB_NAME,
});

con.connect(function (err) {
    if (err) throw err;
    console.log("SQL Connected!");
    console.log(PAYPAL_CLIENT_ID);
    console.log(PAYPAL_CLIENT_SECRET);
});

// host static files
app.use(express.static("./"));

// parse post params sent in body in json format
app.use(express.json());

app.get("/main-slider", async (req, res) => {
    try {
        const files = await promises.readdir(`./img/main-slider`);
        res.status(200).json(files);
    } catch (err) {
        res.status(500).json(err);
    }
});

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        const auth = Buffer.from(
            PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
        ).toString("base64");
        const response = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
    }
};

const createVKOrder = async (cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    console.log(
        "shopping cart information passed from the frontend createOrder() callback:",
        cart
    );
    // Calculate the total price for the purchase unit's "amount"
    const totalAmount = calculateTotalPrice(cart[0]);
    // Log the total amount for debugging
    console.log("Total Amount:", totalAmount);

    const orderId = await createOrderSQL(null, cart, false);
    console.log("Order id createVKOrder:", orderId);
    return orderId;
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    console.log(
        "shopping cart information passed from the frontend createOrder() callback:",
        cart
    );

    // Calculate the total price for the purchase unit's "amount"
    const totalAmount = cart[0].reduce((total, item) => {
        const itemPrice = parseFloat(item.price);
        const itemQuantity = parseInt(item.quantity, 10);

        if (!isNaN(itemPrice) && !isNaN(itemQuantity)) {
            return total + itemPrice * itemQuantity;
        } else {
            console.warn(`Invalid price or quantity for item: ${item.title}`);
            return total;
        }
    }, 0);
    // Log the total amount for debugging
    console.log("Total Amount:", totalAmount);

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "EUR",
                    value: totalAmount.toString(),
                },
            },
        ],
    };

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "Access-Control-Allow-Origin": "*",
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
        method: "POST",
        body: JSON.stringify(payload),
    });
    return handleResponse(response, cart !== null ? cart : undefined);
};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
    });

    return handleResponse(response);
};

async function handleResponse(response, cart = null) {
    try {
        const jsonResponse = await response.json();
        console.log(JSON.stringify(jsonResponse, null, 2));
        if (jsonResponse.status === "CREATED") {
            createOrderSQL(jsonResponse, cart);
        } else if (jsonResponse.status === "COMPLETED") {
            // Extract relevant data from the response
            const {
                gross_amount: { value: grossAmount },
                paypal_fee: { value: paypalFee },
                net_amount: { value: netAmount },
            } = jsonResponse.purchase_units[0].payments.captures[0]
                .seller_receivable_breakdown;

            var sql =
                "UPDATE aaa_orders SET order_status = '" +
                jsonResponse.status +
                "', paypal_transaction_id = '" +
                jsonResponse.purchase_units[0].payments.captures[0].id +
                "', order_payer_id = '" +
                jsonResponse.payment_source.paypal.account_id +
                "', order_payer_name = '" +
                jsonResponse.payment_source.paypal.name.given_name +
                "', order_payer_surname = '" +
                jsonResponse.payment_source.paypal.name.surname +
                "', order_payer_email = '" +
                jsonResponse.payer.email_address +
                "', order_gross_amount = " +
                grossAmount +
                ", order_paypal_fee = " +
                paypalFee +
                ", order_net_amount = " +
                netAmount +
                ", order_update_time = '" +
                new Date().toISOString().slice(0, 19).replace("T", " ") +
                "' WHERE paypal_order_id = '" +
                jsonResponse.id +
                "'";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("Transaction completed: " + jsonResponse.id);
            });

            // Set tickets with the corresponding order id to "payed" = 1
            const paypalIdToUpdate = jsonResponse.id; // The value to match in the "ticket_paypal_id" column
            // Update the "ticket_payed" column to 1 where "ticket_paypal_id" matches the value
            const updateQuery =
                "UPDATE aaa_tickets_24 SET ticket_payed = 1 WHERE ticket_paypal_id = ?";

            con.query(updateQuery, [paypalIdToUpdate], (err, results) => {
                if (err) {
                    console.error("Error updating rows:", err);
                } else {
                    const affectedRows = results.affectedRows;
                    console.log(
                        `Updated ${affectedRows} rows in aaa_tickets_24 where ticket_paypal_id = ${paypalIdToUpdate}`
                    );
                }
            });

            // Start generateTicket.js for the corresponding order id
            // Query the database to retrieve rows with the specific ticket_paypal_id
            const query = `SELECT * FROM aaa_tickets_24 WHERE ticket_paypal_id = ?`;
            con.query(query, [paypalIdToUpdate], (err, results) => {
                if (err) {
                    console.error("Error executing query:", err);
                    return;
                }

                // Process the results here (results is an array of rows)
                console.log("Rows with specific ticket_paypal_id:", results);

                // Process ticket generation and send out ticket mail
                processTicketsAndSendEmail(results);
            });
        }
        return {
            jsonResponse,
            httpStatusCode: response.status,
        };
    } catch (err) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}

app.post("/api/orders", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { cart } = req.body;
        const { jsonResponse, httpStatusCode } = await createOrder(cart);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
});

app.post("/api/ordersVK", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { cart } = req.body;

        // const { orderInfo, httpStatusCode } = await createVKOrder(cart);
        let orderId = await createVKOrder(cart);
        // Send a response back to the client if necessary
        console.log("order id: " + orderId);
        let ticketTable = generateTicketTableFromCart(cart[0]);
        let emailContent = `
            Hello, vielen Dank für deine Ticketbestellung!<br>

            <p>Bestellnummer: ${orderId}<br>
            Kontoinhaber: Kultureller Untergrund Riedenburg e.V.<br>
            IBAN: DE73 7505 1565 0010 4134 25<br>
            EUR: ${calculateTotalPrice(cart[0])} €<br><br>
            Bitte überweise den angezeigten Betrag und gib die Bestellnummer als Verwendugszweck an.<br>
            Nach Eingang der Zahlung schicken wir dir eine Ticketmail innerhalb 1-3 Nichtarbeitstagen ;)<br>
            ${ticketTable}`;

        sendMailContent(emailContent, cart[1]);
        res.json(orderId);
    } catch (error) {
        console.error("Failed to create vk order:", error);
        res.status(500).json({ error: "Failed to create vk order." });
    }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
});

// Handle the manual email sending route
app.post("/send-mail/:orderId/:email?", async (req, res) => {
    const { orderId, email } = req.params;

    // Your existing logic for sending email with orderId and email
    try {
        await sendMail(orderId, email || ""); // Use empty string if email is not provided
        res.status(200).send("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).send("Failed to send email");
    }
});

// serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.resolve("./index.html"));
});

app.listen(PORT, () => {
    console.log(`Node server listening at https://aaa.supacoda:${PORT}`);
});

async function processTicketsAndSendEmail(results) {
    try {
        await generateTickets(results);
        await sendMail(results[0].ticket_order_id);
        // Email sent successfully
    } catch (error) {
        console.error("Ticket processing error:", error);
    }
}
// Route to handle fetching lineup data
app.get("/lineup", (req, res) => {
    console.log("get lineup");
    // Assuming you have a table named 'artists' in your database
    const query = "SELECT * FROM aaa_artists_24";

    con.query(query, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send("Error fetching lineup data");
        } else {
            res.json(results);
        }
    });
});

// Define a route to fetch messages
app.get("/messages", (req, res) => {
    // SQL query to select all messages from the 'messages' table
    const sql = "SELECT * FROM messages";

    // Execute the query
    con.query(sql, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Send the results as JSON to the client
        res.json(results);
    });
});

// Endpoint to handle the form submission and add a new message
app.post("/addMessage", (req, res) => {
    const { msg, name } = req.body;

    // SQL query with placeholders for parameters
    const sql =
        "INSERT INTO messages (text, name, timestamp) VALUES (?, ?, NOW())";
    // Execute the query with parameters
    con.query(sql, [msg, name], (err, result) => {
        if (err) {
            console.error("Error adding message:", err);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }

        console.log("Message added successfully");
        res.json({ success: true });
    });
});


app.post('/upload', upload.single('video'), (req, res) => {
    // Handle file upload
    const file = req.file;
    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }
    // Process the file, store in the database, etc.
    res.send('File uploaded successfully.');
});