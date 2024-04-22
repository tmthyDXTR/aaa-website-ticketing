let imageUrls = []; // Array to store image URLs
let currentIndex = 0; // Current index of the displayed image

const prevButton = document.getElementById("main-slider-prev-button");
const nextButton = document.getElementById("main-slider-next-button");

prevButton.addEventListener("click", () => {
    // Move to the previous image
    currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
    displayCurrentImage();
});

nextButton.addEventListener("click", () => {
    // Move to the next image
    currentIndex = (currentIndex + 1) % imageUrls.length;
    displayCurrentImage();
});

// Function to fetch image URLs from the server
function fetchImageUrls() {
    fetch("/main-slider")
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // // Assuming the server responds with an array of image filenames
            imageUrls = data.map(filename => `./img/main-slider/${filename}`);
            // displayCurrentImage(); // Display the first image after fetching the URLs
        })
        .catch(error => console.error("Error fetching image URLs:", error));
}

// Function to display the current image
function displayCurrentImage() {
    const currentImageUrl = imageUrls[currentIndex];
    // Assuming you have an element to display the image
    const imageElement = document.getElementById("current-image");
    imageElement.style.backgroundImage = `url('${currentImageUrl}')`;
}

// Fetch image URLs when the page loads
window.onload = fetchImageUrls;
