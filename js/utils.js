
// Function to validate an email address
export function isValidEmail(email, email2) {
    if (email.toUpperCase() !== email2.toUpperCase()) return false;
    // Regular expression for a valid email pattern
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    // Test the input email against the regular expression
    return emailRegex.test(email);
}

// Function to calculate the total price of items in the cart
export function calculateTotalPrice(shoppingCart) {
    return shoppingCart.reduce(
        (total, ticket) => total + ticket.price * ticket.quantity,
        0
    );
}

// Promisify the connection.query method
export const queryAsync = (con, query, values) => {
    return new Promise((resolve, reject) => {
        con.query(query, values, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

export function generateOrderId(length) {
    const charset = "0123456789";
    let securityCode = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        securityCode += charset.charAt(randomIndex);
    }
    return securityCode;
}
