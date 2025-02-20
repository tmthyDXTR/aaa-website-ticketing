import mysql from "mysql";
import { generateTickets } from "./generateTickets.js"; // Assuming this is the file containing the generateTickets function
import "dotenv/config";

// Read the order ID from the command line arguments
const orderId = process.argv[2];

if (!orderId) {
    console.error("Please provide an order ID as an argument.");
    process.exit(1);
}

// SQL connection
const { SQL_HOST, SQL_DB_NAME, SQL_USER_NAME, SQL_USER_PASSWORD } = process.env;
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

    // Query the database to retrieve rows with the specific ticket_paypal_id
    const query = `SELECT * FROM aaa_tickets_25 WHERE ticket_paypal_id = ?`;
    con.query(query, [orderId], async (err, results) => {
        if (err) {
            console.error("Error executing query:", err);
            return;
        }

        // Process the results here (results is an array of rows)
        console.log("Rows with specific ticket_paypal_id:", results);

        // Process ticket generation
        try {
            const generatedTicketPaths = await generateTickets(results);
            console.log("Ticket generation completed. Paths:", generatedTicketPaths);
        } catch (error) {
            console.error("Ticket generation failed:", error);
        }

        // Close the database connection
        con.end((err) => {
            if (err) {
                console.error("Error closing database connection:", err);
                return;
            }
            console.log("Database connection closed.");
        });
    });
});
