import "dotenv/config";
import mysql from "mysql";
import { generateTickets } from "./generateTickets.js";
import { sendMail } from "./sendMail.js";

async function setOrderPayed(orderId) {
    if (!orderId) {
        console.error("Please provide an order ID as an argument.");
        process.exit(1);
    }

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
    con.connect((err) => {
        if (err) {
            console.error("Error connecting to database:", err);
            return;
        }

        console.log("Connected to the database.");

        const queryUpdate = `UPDATE aaa_orders SET order_status = "COMPLETED", order_update_time=? WHERE order_id = ?`;
        con.query(queryUpdate, [new Date().toISOString().slice(0, 19).replace("T", " "), orderId], async (err, results) => {
            if (err) {
                console.error("Error executing query:", err);
                return;
            }

            // Process the results here (results is an array of rows)
            console.log("Orders with specific order_id:", results);

            // Close the database connection
            con.end((err) => {
                if (err) {
                    console.error("Error closing database connection:", err);
                    return;
                }
                console.log("Database connection closed.");
            });
        });

        // Query the database to update the payed status of the specific orderId
        const query =
            "UPDATE `aaa_tickets_24` SET `ticket_payed`=1 WHERE ticket_order_id = ?";
        con.query(query, [orderId], async (err, results) => {
            if (err) {
                console.error("Error executing query:", err);
                return;
            }

            // Process the results here (results is an array of rows)
            console.log("Tickets with specific order_id:", results);

            // Close the database connection
            con.end((err) => {
                if (err) {
                    console.error("Error closing database connection:", err);
                    return;
                }
                console.log("Database connection closed.");
            });
        });

        const querySelect = `SELECT * FROM aaa_tickets_24 WHERE ticket_order_id = ?`;
        con.query(querySelect, [orderId], async (err, results) => {
            if (err) {
                console.error("Error executing query:", err);
                return;
            }

            // Process the results here (results is an array of rows)
            console.log("Rows with specific ticket_paypal_id:", results);


            // Process ticket generation and sending
            try {
                const generatedTicketPaths = await generateTickets(results);
                await sendMail(orderId);
                console.log(
                    "Tickets generated and sent:",
                    generatedTicketPaths
                );
            } catch (error) {
                console.error("Ticket generation and sending failed:", error);
            }
        });
    });
}



// If called on command line
// If called on command line
const args = process.argv.slice(2); // Get command-line arguments excluding 'node' and 'your-module.js'
if (args.length > 0) {
    // Read the order ID from the command line arguments
    const id = process.argv[2];
    setOrderPayed(id);
} else {
    console.log("setOrderPayed.js start: no parameter given");
}
