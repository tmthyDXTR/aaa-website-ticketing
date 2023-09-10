import express, { json } from "express";
import fetch from "node-fetch";
import "dotenv/config";
import path from "path";
import mysql from "mysql";
import { generateTickets } from "./generateTickets.js";
import { sendMail } from "./sendMail.js";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8080  } = process.env;
const base = "https://api-m.sandbox.paypal.com";
const app = express();


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


// host static files
app.use(express.static("./"));

// parse post params sent in body in json format
app.use(express.json());

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
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
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
  console.log('Total Amount:', totalAmount);

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

async function handleResponse(response, cart=null) {
  var lastInsertId;
  try {
    const jsonResponse = await response.json();
    console.log(JSON.stringify(jsonResponse, null, 2));
    if (jsonResponse.status === "CREATED") {
      var sql = "INSERT INTO aaa_orders (paypal_order_id, order_status, order_create_time, order_update_time) VALUES ('"+jsonResponse.id+"', '"+jsonResponse.status+"', '"+new Date().toISOString().slice(0, 19).replace('T', ' ')+"', '"+new Date().toISOString().slice(0, 19).replace('T', ' ')+"')";
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Transaction created: " + jsonResponse.id);
        lastInsertId = result.insertId;
        // Add tickets in cart to sql db as "tickets not yet payed" = 0
      for (const cartItem of cart[0]) {
        if (cartItem.quantity != 0) {
          for (var i = 0; i < cartItem.quantity; i++) {
            const { title, price, type } = cartItem;
            const paypalId = jsonResponse.id;
            
            function generateSecurityCode(length) {
              const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
              let securityCode = '';
              for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * charset.length);
                securityCode += charset.charAt(randomIndex);
              }
              return securityCode;
            }
            const ticketSec = generateSecurityCode(6);
            const holderEmail = cart[1];
            // Insert the item into the "aaa_tickets_24" table
            const sql = `INSERT INTO aaa_tickets_24 (ticket_order_id, ticket_paypal_id, ticket_type, ticket_security_code, ticket_name, ticket_price, ticket_holder_email, ticket_created_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
            con.query(sql, [lastInsertId, paypalId, type, ticketSec, title, price, holderEmail, new Date().toISOString().slice(0, 19).replace('T', ' ')], (err, results) => {
              if (err) {
                console.error('Error inserting item into the table:', err);
              } else {
                console.log('Item inserted successfully:', title + ": " + ticketSec);
              }
            });
          }
          
        }        
      }  
      });      
      
    }
    else if (jsonResponse.status === "COMPLETED") {
      // Extract relevant data from the response
      const {
        gross_amount: { value: grossAmount },
        paypal_fee: { value: paypalFee },
        net_amount: { value: netAmount },
      } = jsonResponse.purchase_units[0].payments.captures[0].seller_receivable_breakdown;

      var sql = "UPDATE aaa_orders SET order_status = '"+jsonResponse.status+"', paypal_transaction_id = '"+jsonResponse.purchase_units[0].payments.captures[0].id+"', order_payer_id = '"+jsonResponse.payment_source.paypal.account_id+"', order_payer_name = '"+jsonResponse.payment_source.paypal.name.given_name+"', order_payer_surname = '"+jsonResponse.payment_source.paypal.name.surname+"', order_payer_email = '"+jsonResponse.payer.email_address+"', order_gross_amount = "+grossAmount+", order_paypal_fee = "+paypalFee+", order_net_amount = "+netAmount+", order_update_time = '"+new Date().toISOString().slice(0, 19).replace('T', ' ')+"' WHERE paypal_order_id = '"+jsonResponse.id+"'";
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Transaction completed: " + jsonResponse.id);
      });    

      // Set tickets with the corresponding order id to "payed" = 1
      const paypalIdToUpdate = jsonResponse.id; // The value to match in the "ticket_paypal_id" column
      // Update the "ticket_payed" column to 1 where "ticket_paypal_id" matches the value
      const updateQuery = 'UPDATE aaa_tickets_24 SET ticket_payed = 1 WHERE ticket_paypal_id = ?';

      con.query(updateQuery, [paypalIdToUpdate], (err, results) => {
        if (err) {
          console.error('Error updating rows:', err);
        } else {
          const affectedRows = results.affectedRows;
          console.log(`Updated ${affectedRows} rows in aaa_tickets_24 where ticket_paypal_id = ${paypalIdToUpdate}`);
        }
      });

      // Start generateTicket.js for the corresponding order id
      // Query the database to retrieve rows with the specific ticket_paypal_id
      const query = `SELECT * FROM aaa_tickets_24 WHERE ticket_paypal_id = ?`;
      con.query(query, [paypalIdToUpdate], (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          return;
        }
        
        // Process the results here (results is an array of rows)
        console.log('Rows with specific ticket_paypal_id:', results);
        
        try {
          generateTickets(results)
          .then((ticketLinks) => {
            console.log("Ticket links:", ticketLinks);
            // Do something with the ticket links
            for (const key in ticketLinks) {
              if (ticketLinks.hasOwnProperty(key)) {
                const ticket = ticketLinks[key];
                const securityCode = ticket.securityCode;
                const url = ticket.url;
                console.log(`Ticket ${key}: Security Code: ${securityCode}, Url: ${url}`);
                const updateQuery = 'UPDATE aaa_tickets_24 SET ticket_url = ? WHERE ticket_security_code = ?';
                con.query(updateQuery, [url, securityCode], (err, results) => {
                  if (err) {
                    console.error('Error updating rows:', err);
                  } else {
                    const affectedRows = results.affectedRows;
                    console.log(`Updated ${affectedRows} rows in aaa_tickets_24 where ticket_security_code = ${securityCode}`);
                  }
                });
              }        
            }
            sendMail(results[0].ticket_order_id);
          })
          .catch((error) => {
            console.error("Ticket generation error:", error);
          });
        } catch (error) {
          console.error('Ticket generation failed:', error); // Error message
        }
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

// serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.resolve("./index.html"));
});

app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});





