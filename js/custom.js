import { content } from './content.js';
import { tickets } from './tickets.js';
import { isValidEmail, calculateTotalPrice } from "./utils.js";

let menuIsActive = false;
let contentWindowIsActive = false;

const menuBtn = document.getElementById('menu-btn');
const menuWindow = document.getElementById('menu-window');
const contentWindow = document.getElementById('content-window');
const alertWindow = document.getElementById('alert-window');
let copyEmails = document.querySelectorAll('.copy-email');

document.getElementById("cart-btn").addEventListener('click', () => {
    //console.log("TICKETS button clicked");
    menuWindow.classList.remove('show');
    menuWindow.classList.add('hidden');
    menuIsActive = false;
    menuBtn.innerHTML = "MENU";

    initShop();
    contentWindow.classList.remove('hidden');
    contentWindow.classList.add('show');
    // contentWindow.classList.add('show');
    // contentWindow.classList.add('hidden');
    contentWindowIsActive = true;
});

document.getElementById("pay-btn").addEventListener('click', () => {
    //console.log("PAY button clicked");
    menuWindow.classList.remove('show');
    menuWindow.classList.add('hidden');
    menuIsActive = false;
    menuBtn.innerHTML = "MENU";

    initPay();
    contentWindow.classList.remove('hidden');
    contentWindow.classList.add('show');
    // contentWindow.classList.add('show');
    // contentWindow.classList.add('hidden');
    contentWindowIsActive = true;
});


document.addEventListener("DOMContentLoaded", function () {
    initCopyEmails();
    getCartFromLocalStorage();

    menuBtn.addEventListener('click', () => {
        toggleMenu();
        if (contentWindowIsActive) toggleContentWindow();
    });



    const buttonMappings = {
        'bewirb-button': content.bewirb,
        'helfer-button': content.helfer,
        'kur-button': content.kur,
        'festival-button': content.festival,
        'green-button': content.green,
        'impressum-button': content.impressum,
        'tickets-button': 'tickets',
        // Add other buttons as needed
    };

    const alertOkButton = document.getElementById('alert-ok-button');
    const alertContent = document.getElementById('alert-content');

    function handleButtonClick(buttonId) {
        return () => {
            toggleMenu();
            toggleContentWindow();
            const content = buttonMappings[buttonId];
            if (content !== "tickets") {
                contentWindow.innerHTML = content;
                initCopyEmails();
            }
            if (content === "tickets") {
                initShop();
            }
        };
    }

    // Add event listeners dynamically for each button
    Object.keys(buttonMappings).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', handleButtonClick(buttonId));
        }
    });

    alertOkButton.addEventListener('click', () => {
        toggleAlert();
    });

    function initCopyEmails() {
        let copyEmails = document.querySelectorAll('.copy-email');
        copyEmails.forEach(emailSpan => {
            emailSpan.addEventListener('click', () => {
                const email = emailSpan.getAttribute('data-email');
                copyToClipboard(email);
                //console.log(`Copied email: ${email}`);

                alertContent.innerHTML = `Email kopiert: ${email}`;
                toggleAlert();
            });
        });
        function copyToClipboard(text) {
            const tempInput = document.createElement('input');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }
    }
});

function toggleMenu() {
    menuIsActive = !menuIsActive;
    if (menuIsActive) {
        menuWindow.classList.add('show');
        menuWindow.classList.remove('hidden');
        menuBtn.innerHTML = "X";
    } else {
        menuWindow.classList.add('hidden');
        menuWindow.classList.remove('show');
        menuBtn.innerHTML = "MENU";
    }
    //console.log("Menu is now " + (menuIsActive ? "open" : "closed"));
}

function toggleContentWindow() {
    contentWindowIsActive = !contentWindowIsActive;
    if (contentWindowIsActive) {
        contentWindow.classList.add('show');
        contentWindow.classList.remove('hidden');
    } else {
        contentWindow.classList.add('hidden');
        contentWindow.classList.remove('show');
    }
    //console.log("Content window is now " + (contentWindowIsActive ? "open" : "closed"));
    // Scroll the content window to the top
    contentWindow.scrollTop = 0;
}



function initShop() {

    //console.log("Init shop");

    const shopContainer = document.createElement('div');
    shopContainer.classList.add('shop-container');


    for (const ticketKey in tickets) {
        const ticket = tickets[ticketKey];

        const productDiv = document.createElement('div');
        productDiv.classList.add('product');

        const img = document.createElement('img');
        img.src = 'img/ticket.png';
        img.alt = 'Ticket';

        const h4 = document.createElement('h4');
        h4.textContent = ticket.title;
        const br = document.createElement('br');
        const pPrice = document.createElement('p');
        pPrice.textContent = ticket.price + " €";
        const pAmount = document.createElement('p');
        pAmount.id = ticket.title + "-qty";
        const buttonInfo = document.createElement('button');
        buttonInfo.classList.add('dos-button');
        buttonInfo.textContent = 'Info';
        let infoText = `<h4>` + ticket.title + `</h4>
                        `+ ticket.description + `<br><br>
                        `+ ticket.price + ` €`;
        buttonInfo.addEventListener('click', () => toggleAlert(infoText));

        const buttonPlus = document.createElement('button');
        buttonPlus.classList.add('dos-button');
        buttonPlus.textContent = '+';
        buttonPlus.addEventListener('click', () => addTicketToCart(ticket));
        const buttonMinus = document.createElement('button');
        buttonMinus.classList.add('dos-button');
        buttonMinus.textContent = '-';
        buttonMinus.addEventListener('click', () => removeTicketFromCart(ticket));

        productDiv.appendChild(img);
        productDiv.appendChild(h4);
        productDiv.appendChild(pPrice);
        productDiv.appendChild(pAmount);
        const existingTicketIndex = shoppingCart.findIndex(t => t.title === ticket.title);
        if (existingTicketIndex !== -1) {
            // If the ticket is already in the cart
            pAmount.innerHTML = "x " + shoppingCart[existingTicketIndex].quantity;
        } else {
            // If the ticket is not in the cart
            pAmount.innerHTML = "x 0";
        }
        // productDiv.appendChild(description);
        productDiv.appendChild(buttonInfo);
        productDiv.appendChild(br);
        productDiv.appendChild(buttonPlus);
        productDiv.appendChild(buttonMinus);

        shopContainer.appendChild(productDiv);

    }
    contentWindow.innerHTML = '';
    contentWindow.appendChild(shopContainer);
    //console.log(shopContainer);
}

// shopping cart array to store ticket data
let shoppingCart = [];
function addTicketToCart(ticketData) {
    // Check if the ticket is already in the cart
    const existingTicketIndex = shoppingCart.findIndex(ticket => ticket.title === ticketData.title);

    if (existingTicketIndex !== -1) {
        // If the ticket is already in the cart, update its quantity
        shoppingCart[existingTicketIndex].quantity += 1;
        document.getElementById(ticketData.title + "-qty").innerHTML = "x " + shoppingCart[existingTicketIndex].quantity;
    } else {
        // If the ticket is not in the cart, add it as a new item
        shoppingCart.push(ticketData);
        document.getElementById(ticketData.title + "-qty").innerHTML = "x 1";
    }
    // Update cart buttons euro amount
    updateCartButton();

    // moveTicketToCart();
    //console.log("Add ticket to cart: ");
    //console.log(ticketData);
    //console.log("Cart:")
    //console.log(shoppingCart);
    saveCartToLocalStorage(shoppingCart);
}

function removeTicketFromCart(ticketData) {
    // Check if the ticket is already in the cart
    const existingTicketIndex = shoppingCart.findIndex(ticket => ticket.title === ticketData.title);

    if (existingTicketIndex !== -1 && shoppingCart[existingTicketIndex].quantity > 0) {
        // If the ticket is already in the cart, update its quantity
        shoppingCart[existingTicketIndex].quantity -= 1;
        document.getElementById(ticketData.title + "-qty").innerHTML = "x " + shoppingCart[existingTicketIndex].quantity;
    }
    // Update cart buttons euro amount
    updateCartButton();

    // moveTicketToCart();
    //console.log("Remove ticket from cart: ");
    //console.log(ticketData);
    //console.log("Cart:")
    //console.log(shoppingCart);
    saveCartToLocalStorage(shoppingCart);
}



// Function to save cart to local storage
function saveCartToLocalStorage(shoppingCart) {
    localStorage.setItem('shoppingCart', JSON.stringify(shoppingCart));
}
// Function to retrieve cart from local storage
function getCartFromLocalStorage() {
    const cartData = localStorage.getItem('shoppingCart');
    if (cartData) {
        shoppingCart = JSON.parse(cartData);
        updateCartButton();
    }
}

// Function to update cart button content
function updateCartButton() {
    const cartButton = document.getElementById("cart-btn");
    const payButton = document.getElementById("pay-btn");
    cartButton.innerHTML = `TICKETS: ${calculateTotalPrice(shoppingCart).toFixed(0)} €`;
    if (calculateTotalPrice(shoppingCart).toFixed(0) == 0) {
        cartButton.innerHTML = `TICKETS`;
        payButton.classList.add("hidden");
    }
    else {
        payButton.classList.remove("hidden");
    }
    if (cartButton.classList.contains("hidden")) {
        cartButton.classList.remove("hidden");
    }
}

function moveTicketToCart() {
    //console.log("Move ticket to cart");
    const imageContainer = document.getElementById('content-window');

    // Create a new image element
    const image = new Image();
    image.src = 'img/ticket.png';
    image.classList.add('animated-image');
    // Listen for the image load event
    image.onload = function () {
        //console.log("image created");
        // Append the image to the imageContainer
        imageContainer.appendChild(image);

        // Show the image
        image.style.display = 'block';

        // Move the image to the desired position
        image.style.width = '20vw';
        image.style.height = 'auto';
        image.style.position = 'absolute';
        image.style.left = '50%';
        image.style.top = '50%';
        image.style.transform = 'translate(-50%, -50%)';

        // Make the image disappear after a delay (you can adjust the delay)
        setTimeout(() => {
            image.style.display = 'none';
            imageContainer.removeChild(image);
        }, 2000); // Change 2000 to the desired delay in milliseconds
    };

    // Set up error handling in case the image fails to load
    image.onerror = function () {
        console.error("Failed to load the image.");
    };
}


function initPay() {
    //console.log("Init payment");
    contentWindow.innerHTML = '';
    generateCheckoutFromLocalStorage();
    generateUserDataForm();
}

// Function to generate a checkout overview
function generateCheckoutOverview(cartData) {
    const checkoutContainer = contentWindow;

    // Clear any previous content
    checkoutContainer.innerHTML = '';

    // Create a table element
    const table = document.createElement("table");
    table.classList.add("checkout-table");

    // Create the table header row
    const tableHeader = document.createElement("tr");
    const headerTitles = ["Typ", "Preis", "Anz.", "Gesamt"];
    headerTitles.forEach(title => {
        const th = document.createElement("th");
        th.textContent = title;
        if (title === "Preis" || title === "Anz." || title === "Gesamt") {
            th.classList.add("right-align"); // Right-align header cells
        }
        tableHeader.appendChild(th);
    });
    table.appendChild(tableHeader);

    let totalPrice = 0;

    // Iterate through the cart data and create rows for each item
    cartData.forEach(ticket => {
        if (ticket.quantity > 0) {
            const row = document.createElement("tr");

            const titleCell = document.createElement("td");
            titleCell.textContent = ticket.title;

            const priceCell = document.createElement("td");
            priceCell.textContent = `${ticket.price} €`;
            priceCell.classList.add("right-align"); // Add a class for styling

            const quantityCell = document.createElement("td");
            quantityCell.textContent = ticket.quantity;
            quantityCell.classList.add("right-align"); // Add a class for styling

            const ticketTotalCell = document.createElement("td");
            ticketTotalCell.textContent = ticket.quantity * ticket.price + " €";
            ticketTotalCell.classList.add("right-align"); // Add a class for styling

            // Append cells to the row
            row.appendChild(titleCell);
            row.appendChild(priceCell);
            row.appendChild(quantityCell);
            row.appendChild(ticketTotalCell);

            // Append the row to the table
            table.appendChild(row);


            // Calculate total price
            totalPrice += ticket.price * ticket.quantity;
        }
    });

    // Create the total row
    const totalRow = document.createElement("tr");
    totalRow.classList.add("total-row");

    const totalCell = document.createElement("td");
    totalCell.colSpan = 3;
    totalCell.textContent = "Total";

    const totalAmountCell = document.createElement("td");
    totalAmountCell.textContent = `${totalPrice} €`;
    totalAmountCell.classList.add("right-align"); // Add a class for styling


    totalRow.appendChild(totalCell);
    totalRow.appendChild(totalAmountCell);

    // // Append the total row to a table footer
    // const tableFooter = document.createElement("tfoot");
    // tableFooter.appendChild(totalRow);

    // Append the table footer to the table
    table.appendChild(totalRow);

    // Create the MwSt row
    const mwstRow = document.createElement("tr");
    mwstRow.classList.add("mwst-row");

    const mwstCell = document.createElement("td");
    mwstCell.colSpan = 3;
    mwstCell.textContent = "(inklusive 7% MwSt.)";

    const mwstAmountCell = document.createElement("td");
    mwstAmountCell.textContent = (totalPrice - ((totalPrice / 107) * 100)).toFixed(2) + ` €`;
    mwstAmountCell.classList.add("right-align"); // Add a class for styling

    mwstRow.appendChild(mwstCell);
    mwstRow.appendChild(mwstAmountCell);
    table.appendChild(mwstRow);

    // Append the table to the checkout container
    checkoutContainer.appendChild(table);
}


// Function to retrieve cart from local storage and generate checkout overview
function generateCheckoutFromLocalStorage() {
    const cartData = localStorage.getItem('shoppingCart');
    if (cartData) {
        const parsedCartData = JSON.parse(cartData);
        generateCheckoutOverview(parsedCartData);
    }
}


function generateUserDataForm() {
    const userInformationDiv = document.createElement('userInformation');
    userInformationDiv.appendChild(document.createElement('hr'));

    // Name input
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'name');
    nameLabel.textContent = 'Vorname:';
    userInformationDiv.appendChild(nameLabel);
    userInformationDiv.appendChild(document.createElement('br'));


    const nameInput = document.createElement('input');
    nameInput.setAttribute('type', 'text');
    nameInput.setAttribute('id', 'name');
    nameInput.setAttribute('name', 'name');
    nameInput.setAttribute('required', 'false');
    userInformationDiv.appendChild(nameInput);
    userInformationDiv.appendChild(document.createElement('br'));

    const surnameLabel = document.createElement('label');
    surnameLabel.setAttribute('for', 'surname');
    surnameLabel.textContent = 'Nachname:';
    userInformationDiv.appendChild(surnameLabel);
    userInformationDiv.appendChild(document.createElement('br'));


    const surnameInput = document.createElement('input');
    surnameInput.setAttribute('type', 'text');
    surnameInput.setAttribute('id', 'surname');
    surnameInput.setAttribute('name', 'surname');
    surnameInput.setAttribute('required', 'false');
    userInformationDiv.appendChild(surnameInput);
    userInformationDiv.appendChild(document.createElement('br'));

    // Email Address input
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'email');
    emailLabel.textContent = 'Email*:';
    userInformationDiv.appendChild(emailLabel);
    userInformationDiv.appendChild(document.createElement('br'));


    const emailInput = document.createElement('input');
    emailInput.setAttribute('type', 'email');
    emailInput.setAttribute('id', 'email');
    emailInput.setAttribute('name', 'email');
    emailInput.setAttribute('required', 'true');
    userInformationDiv.appendChild(emailInput);
    userInformationDiv.appendChild(document.createElement('br'));

    const emailLabel2 = document.createElement('label');
    emailLabel2.setAttribute('for', 'email2');
    emailLabel2.textContent = 'Email bestätigen*:';
    userInformationDiv.appendChild(emailLabel2);
    userInformationDiv.appendChild(document.createElement('br'));

    const emailInput2 = document.createElement('input');
    emailInput2.setAttribute('type', 'email');
    emailInput2.setAttribute('id', 'email2');
    emailInput2.setAttribute('name', 'email2');
    emailInput2.setAttribute('required', 'true');
    userInformationDiv.appendChild(emailInput2);
    userInformationDiv.appendChild(document.createElement('br'));

    // Handynr input
    const mobileLabel = document.createElement('label');
    mobileLabel.setAttribute('for', 'mobile');
    mobileLabel.textContent = 'Handynr:';
    userInformationDiv.appendChild(mobileLabel);
    userInformationDiv.appendChild(document.createElement('br'));

    const mobileInput = document.createElement('input');
    mobileInput.setAttribute('type', 'number');
    mobileInput.setAttribute('id', 'mobile');
    mobileInput.setAttribute('name', 'mobile');
    mobileInput.setAttribute('required', 'false');
    userInformationDiv.appendChild(mobileInput);
    userInformationDiv.appendChild(document.createElement('br'));

    // Handynr input
    const paymentTypeLabel = document.createElement('label');
    paymentTypeLabel.setAttribute('for', 'paymentType');
    paymentTypeLabel.textContent = 'Zahlungsmittel*:';
    userInformationDiv.appendChild(paymentTypeLabel);
    userInformationDiv.appendChild(document.createElement('br'));

    // Create an array of options
    const options = [
        { label: 'Paypal', value: 'paypal' },
        { label: 'Vorkasse', value: 'vorkasse' },
        { label: 'Bitcoin Lightning', value: 'btcln' },
    ];
    // Loop through the options and create radio buttons dynamically
    options.forEach(option => {
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.id = option.value;
        radioInput.name = 'options';
        radioInput.value = option.value;

        const label = document.createElement('label');
        label.htmlFor = option.value;
        label.textContent = option.label;

        // Append the radio button and label to the container
        userInformationDiv.appendChild(radioInput);
        userInformationDiv.appendChild(label);
        if (option.value === 'vorkasse') {
            radioInput.disabled = true;
        }
        if (option.value === 'paypal') {
            radioInput.checked = true;
        }
        if (option.value === 'btcln') {
            radioInput.disabled = true;
        }
        userInformationDiv.appendChild(document.createElement('br'));
    });

    userInformationDiv.appendChild(document.createElement('br'));

    // BUY button
    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Zahlungspflichtig kaufen';
    buyBtn.classList.add('dos-button');
    buyBtn.addEventListener('click', () => {
        //console.log("BUY button clicked");
        initPurchase();
    });

    userInformationDiv.appendChild(buyBtn);
    // userInformationDiv.appendChild(document.createElement('br'));
    // userInformationDiv.appendChild(document.createElement('br'));



    contentWindow.appendChild(userInformationDiv);

    // Call the function to add listeners and save to local storage
    addInputListenersAndSaveToLocalStorage();

}


function initPurchase() {
    console.log("Init purchase");
    if (!isValidEmail(document.getElementById('email').value, document.getElementById('email2').value)) {
        toggleAlert("Bitte gib eine korrekte Email an.");
        return;
    }
    const selectedRadioValue = localStorage.getItem('selectedRadio');
    //console.log(shoppingCart);
    const email = document.getElementById("email").value;
    //console.log("Payment method: " + selectedRadioValue);
    if (selectedRadioValue === 'paypal') {
        contentWindow.innerHTML = '';
        initPaypalButtons(shoppingCart, email);
    }
    else if (selectedRadioValue === 'vorkasse') {
        // console.log("create vvk order initiated");
        console.log(shoppingCart, email);

        fetch('/api/ordersVK', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cart: [
                    shoppingCart, email,
                ],
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle the response from the server if needed
            console.log('Server response:', data);
        })
        .catch(error => {
            console.error('Error during fetch:', error);
        });

        const userInformation = document.querySelector('div#content-window userinformation');
        userInformation.innerHTML = `<hr>
            <div class="order-info">
                <p>Bestellnummer: 28953<br>
                Kontoinhaber: KUR EV<br>
                IBAN: DE123412354154123<br>
                EUR: ${calculateTotalPrice(shoppingCart)} €
            </div>
            <br>
            <center><button class="dos-button menu-btn" id="copy-order-info-btn">KOPIEREN</button></center>
            <br>

            Ticketmail geht an: ${email}
        `;

        document.getElementById("copy-order-info-btn").addEventListener("click", () => {
            const orderInfoElement = document.querySelector('.order-info');
            const textToCopy = orderInfoElement.innerText;
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = textToCopy;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            tempTextarea.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            // console.log("Content copied to clipboard:", textToCopy);
            toggleAlert("Überweisungsdaten kopiert");
        });


        toggleAlert("Bitte überweise den angezeigten Betrag und gib die Bestellnummer mit an.<br>Du erhältst auch eine Email mit deiner Bestellübersicht.<br>Nach Eingang der Zahlung schicken wir dir eine Ticketmail innerhalb 1-3 Nichtarbeitstagen :)");
    }
}



// Function to add event listeners to input fields, save values to local storage, and fill input fields
function addInputListenersAndSaveToLocalStorage() {
    if (!localStorage.getItem('selectedRadio')) {
        localStorage.setItem('selectedRadio', "vorkasse");
    }

    // Get the input elements by their IDs or other means
    const nameInput = document.getElementById('name');
    const surnameInput = document.getElementById('surname');
    const emailInput = document.getElementById('email');
    const mobileInput = document.getElementById('mobile');

    // Get the radio input elements by their name
    const radioInputs = document.querySelectorAll('input[name="options"]');

    // Function to fill input fields and select radio from values in local storage
    function fillInputFieldsFromLocalStorage() {
        nameInput.value = localStorage.getItem('name') || '';
        surnameInput.value = localStorage.getItem('surname') || '';
        emailInput.value = localStorage.getItem('email') || '';
        mobileInput.value = localStorage.getItem('mobile') || '';

        // Select the radio button based on local storage value
        const selectedRadioValue = localStorage.getItem('selectedRadio') || "vorkasse";
        const radioInput = document.querySelector(`input[type="radio"][value="${selectedRadioValue}"]`);
        if (radioInput) {
            radioInput.checked = true;
        }
    }

    // Add event listeners to input fields
    nameInput.addEventListener('input', () => {
        // Save the value to local storage whenever it changes
        localStorage.setItem('name', nameInput.value);
    });

    surnameInput.addEventListener('input', () => {
        localStorage.setItem('surname', surnameInput.value);
    });

    emailInput.addEventListener('input', () => {
        localStorage.setItem('email', emailInput.value);
    });

    mobileInput.addEventListener('input', () => {
        localStorage.setItem('mobile', mobileInput.value);
    });

    // Add event listeners to radio buttons
    radioInputs.forEach(radioInput => {
        radioInput.addEventListener('change', () => {
            // Save the selected radio value to local storage when it changes
            localStorage.setItem('selectedRadio', radioInput.value);
        });
    });

    // Fill input fields and select radio from values in local storage
    fillInputFieldsFromLocalStorage();
}






function initPaypalButtons(shoppingCart, email) {
    window.paypal
        .Buttons({
            style: {
                layout: 'vertical',
                color: 'black',
                shape: 'rect',
                label: 'paypal'
            },
            async createOrder() {
                try {
                    const response = await fetch("/api/orders", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        // use the "body" param to optionally pass additional order information
                        // like product ids and quantities
                        body: JSON.stringify({
                            cart: [
                                shoppingCart, email,
                            ],
                        }),
                    });

                    const orderData = await response.json();

                    if (orderData.id) {
                        return orderData.id;
                    } else {
                        const errorDetail = orderData?.details?.[0];
                        const errorMessage = errorDetail
                            ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                            : JSON.stringify(orderData);

                        throw new Error(errorMessage);
                    }
                } catch (error) {
                    console.error(error);
                    toggleAlert(`Could not initiate PayPal Checkout...<br><br>${error}`);
                }
            },
            async onApprove(data, actions) {
                try {
                    const response = await fetch(`/api/orders/${data.orderID}/capture`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    const orderData = await response.json();
                    // Three cases to handle:
                    //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                    //   (2) Other non-recoverable errors -> Show a failure message
                    //   (3) Successful transaction -> Show confirmation or thank you message

                    const errorDetail = orderData?.details?.[0];

                    if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                        // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                        // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                        return actions.restart();
                    } else if (errorDetail) {
                        // (2) Other non-recoverable errors -> Show a failure message
                        throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
                    } else if (!orderData.purchase_units) {
                        throw new Error(JSON.stringify(orderData));
                    } else {
                        // (3) Successful transaction -> Show confirmation or thank you message
                        // Or go to another URL:  actions.redirect('thank_you.html');
                        const transaction =
                            orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
                            orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
                        toggleAlert(
                            //   `Transaction ${transaction.status}: ${transaction.id}<br><br>See console for all available details`,
                            `Ticketkauf abgeschlossen. <br><br>Du erhältst in Kürze eine Ticketmail. <br><br>[Solange dein Emailpostfach nicht voll ist ^^]`,
                        );
                        // console.log(
                        //   "Capture result",
                        //   orderData,
                        //   JSON.stringify(orderData, null, 2),
                        // );
                    }
                } catch (error) {
                    console.error(error);
                    toggleAlert(
                        `Sorry, your transaction could not be processed...<br><br>${error}`,
                    );
                }
            },
        })
        .render("#content-window");
}


// Example function to show a result to the user. Your site's UI library can be used instead.
function resultMessage(message) {
    const container = document.querySelector("#result-message");
    container.innerHTML = message;
}


let alertIsActive = false;

export function toggleAlert(text = null) {
    alertIsActive = !alertIsActive;
    if (alertIsActive) {
        alertWindow.classList.add('show');
        alertWindow.classList.remove('hidden');
    } else {
        alertWindow.classList.add('hidden');
        alertWindow.classList.remove('show');
    }
    let alertContent = document.getElementById('alert-content');
    if (text) alertContent.innerHTML = text;
    //console.log("Alert is now " + (alertIsActive ? "open" : "closed"));
}