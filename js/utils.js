// Function to validate an email address
export function isValidEmail(email) {
    // Regular expression for a valid email pattern
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // Test the input email against the regular expression
    return emailRegex.test(email);
}

// Function to calculate the total price of items in the cart
export function calculateTotalPrice(shoppingCart) {
    return shoppingCart.reduce((total, ticket) => total + (ticket.price * ticket.quantity), 0);
}


