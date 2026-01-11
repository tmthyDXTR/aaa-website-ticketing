// Function to fetch messages and display them in chronological order
export function displayMessages() {
    // Fetch data from the server using the fetch API
    fetch("/messages")
        .then((response) => response.json())
        .then((messages) => {
            // Sort messages by timestamp in ascending order
            messages.sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Get the container element
            const messagesContainer =
                document.getElementById("consoleContainer");

            // Clear any existing content in the container
            messagesContainer.innerHTML = "";

            // Loop through the sorted messages and create HTML elements
            messages.forEach((message) => {
                appendMessage(message.timestamp, message.name, message.text);
            });
        })
        .catch((error) => console.error("Error fetching messages:", error));
}

// Function to add a new message
export function addMessage() {
    const textInput = document.getElementById("console-text");
    const nameInput = document.getElementById("console-name");

    const text = textInput.value;
    let name = "anon";
    if (nameInput !== null || nameInput === "") {
        name = nameInput.value;
    }

    // Check if both text and name are provided
    if (text[0] === "/" || text[0] === "-") {
        if (
            text === "/help" ||
            text === "/h" ||
            text === "--help" ||
            text === "-h"
        ) {
            // Get the container element
            const messagesContainer =
                document.getElementById("consoleContainer");
            appendMessage(
                new Date(),
                "aaa",
                `<br>
                # Command list:<br>
                    _ cmd: /name name<br>
                        __ change name<br>
                    _ cmd: /msg message<br>
                        __ write message<br>
            `
            );
            return;
        } else if (text.toUpperCase().split(" ")[0] === "/MSG") {
            const msg = text.split(" ").slice(1).join(" ");
            console.log(text, msg);
            const isOnlySpaces = /^ *$/.test(msg);
            if (msg.length === 0 || isOnlySpaces) {
                appendMessage(
                    new Date(),
                    "aaa",
                    `<br>
                    /msg needs one argument<br>
                `
                );
                return;
            }
            // Send a POST request to the server to add a new message
            fetch("/addMessage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ msg, name }),
            })
                .then((response) => response.json())
                .then((result) => {
                    console.log("Message added successfully:", result);
                    displayMessages();
                    // You can choose to display a success message or perform additional actions
                })
                .catch((error) =>
                    console.error("Error adding message:", error)
                );
        } else {
            appendMessage(
                new Date(),
                "aaa",
                `<br>
                "${text}" unknown command<br>
            `
            );
            return;
        }
    } else {
        appendMessage(
            new Date(),
            "aaa",
            `<br>
            "${text}" unknown command<br>
        `
        );
        return;

        // toggleAlert("ERRORCODE 420.");
    }
}

function appendMessage(timestamp, name, text) {
    const messagesContainer = document.getElementById("consoleContainer");
    const formattedTimestamp = formatTimestamp(timestamp);

    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.innerHTML = `${formattedTimestamp}//<strong>@${name}</strong>: ${text}`;
    messagesContainer.appendChild(messageElement);
    // Scroll to the end of the div
    document.getElementById("content-window").scrollTop =
        document.getElementById("content-window").scrollHeight;
}
function formatTimestamp(timestamp) {
    return new Date(timestamp).toISOString().replace("T", "_").slice(0, -5);
}

