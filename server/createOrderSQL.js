import "dotenv/config";
import mysql from "mysql";


export const createOrderSQL = async (jsonResponse, cart = null) => {
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

    var lastInsertId;
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