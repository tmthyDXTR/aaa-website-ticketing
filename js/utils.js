
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

export function createButton(buttonText, classNames = []) {
    // Create a button element
    const button = document.createElement("button");

    // Set the button text
    button.textContent = buttonText;

    // Add the default class 'dos-button'
    button.classList.add("dos-button");

    // Optionally add additional classes from the classNames array
    if (Array.isArray(classNames)) {
        classNames.forEach((className) => {
            button.classList.add(className);
        });
    }
    return button;
}

export function generateTicketTableFromCart(tickets) {
    // Filter out entries with quantity greater than zero
    const validTickets = tickets.filter(ticket => ticket.quantity > 0);

    // If there are no valid tickets, return an empty string
    if (validTickets.length === 0) {
        return '';
    }

    // Generate HTML for the table header
    let tableHTML = `
        <table border="1">
            <thead>
                <tr>
                    <th>Typ</th>
                    <th>Preis</th>
                    <th>Anzahl</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Generate HTML for each valid ticket entry
    validTickets.forEach(ticket => {
        tableHTML += `
            <tr>
                <td>${ticket.title}</td>
                <td>${ticket.price}</td>
                <td>${ticket.quantity}</td>
            </tr>
        `;
    });

    // Close the table HTML
    tableHTML += `
            </tbody>
        </table>
    `;

    return tableHTML;
}