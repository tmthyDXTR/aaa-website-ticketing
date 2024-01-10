import "dotenv/config";
import mysql from "mysql";
import { generateOrderId } from "../js/utils.js";

export const createOrderSQL = async (
    jsonResponse = null,
    cart = null,
    isPaypalOrder = true
) => {
    // sql
    const { SQL_HOST, SQL_DB_NAME, SQL_USER_NAME, SQL_USER_PASSWORD } =
        process.env;
    var con = mysql.createConnection({
        host: SQL_HOST,
        user: SQL_USER_NAME,
        password: SQL_USER_PASSWORD,
        database: SQL_DB_NAME,
    });
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });
    var vkId = null; // vorkasse id, generated if its not a paypal transaction
    var lastInsertId;
    if (isPaypalOrder) {
        var sql =
            "INSERT INTO aaa_orders (paypal_order_id, order_status, order_create_time, order_update_time) VALUES ('" +
            jsonResponse.id +
            "', '" +
            jsonResponse.status +
            "', '" +
            new Date().toISOString().slice(0, 19).replace("T", " ") +
            "', '" +
            new Date().toISOString().slice(0, 19).replace("T", " ") +
            "')";
    } else {
        // Generate offline order id VORKASSE
        vkId = generateOrderId(5);
        var sql =
            "INSERT INTO aaa_orders (paypal_order_id, order_status, order_create_time, order_update_time) VALUES ('" +
            vkId +
            "', 'CREATED', '" +
            new Date().toISOString().slice(0, 19).replace("T", " ") +
            "', '" +
            new Date().toISOString().slice(0, 19).replace("T", " ") +
            "')";
    }
    con.query(sql, function (err, result) {
        if (err) throw err;

        if (isPaypalOrder) {
            console.log("Paypal Transaction created: " + jsonResponse.id);
        } else {
            console.log("VK Transaction created: " + vkId);
        }
        lastInsertId = result.insertId;
        // Add tickets in cart to sql db as "tickets not yet payed" = 0
        for (const cartItem of cart[0]) {
            if (cartItem.quantity != 0) {
                for (var i = 0; i < cartItem.quantity; i++) {
                    const { title, price, type } = cartItem;

                    const orderId = isPaypalOrder ? jsonResponse.id : vkId;

                    function generateSecurityCode(length) {
                        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                        let securityCode = "";
                        for (let i = 0; i < length; i++) {
                            const randomIndex = Math.floor(
                                Math.random() * charset.length
                            );
                            securityCode += charset.charAt(randomIndex);
                        }
                        return securityCode;
                    }
                    const ticketSec = generateSecurityCode(6);
                    const holderEmail = cart[1];
                    // Insert the item into the "aaa_tickets_24" table
                    const sql = `INSERT INTO aaa_tickets_24 (ticket_order_id, ticket_paypal_id, ticket_type, ticket_security_code, ticket_name, ticket_price, ticket_holder_email, ticket_created_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

                    con.query(
                        sql,
                        [
                            lastInsertId,
                            orderId,
                            type,
                            ticketSec,
                            title,
                            price,
                            holderEmail,
                            new Date()
                                .toISOString()
                                .slice(0, 19)
                                .replace("T", " "),
                        ],
                        (err, results) => {
                            if (err) {
                                console.error(
                                    "Error inserting item into the table:",
                                    err
                                );
                            } else {
                                console.log(
                                    "Item inserted successfully:",
                                    title + ": " + ticketSec
                                );
                            }
                        }
                    );
                }
            }
        }
        console.log("Order id createordersql : " + vkId);
        if (!isPaypalOrder) return vkId;
    });
};
