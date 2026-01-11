export function initFeedbackForm() {
    console.log("init feedback form");

    const contentWindow = document.getElementById("content-window");
    contentWindow.innerHTML = `Ich bin damit einverstanden, dass der KUR e.V. meine Videoaufzeichnung
    verwendet und möglicherweise auf sozialen Kanälen veröffentlicht. <br>`;

    // Display countdown timer
    const counterElement = document.createElement("div");
    counterElement.textContent = "max. 30 seconds";

    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(function (stream) {
            const videoElement = document.createElement("video");
            videoElement.srcObject = stream;
            videoElement.autoplay = true; // Auto play the video
            contentWindow.appendChild(videoElement);

            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];
            let timeLeft = 30; // Initial time left for recording

            mediaRecorder.ondataavailable = function (event) {
                chunks.push(event.data);
            };

            mediaRecorder.onstop = function () {
                const blob = new Blob(chunks, { type: "video/mp4" });
                const formData = new FormData();
                formData.append("video", blob, "recorded-video.mp4");

                // Perform file upload using XHR, Fetch API, etc.
                // Example using Fetch API:
                fetch("/upload", {
                    method: "POST",
                    body: formData,
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Upload failed");
                        }
                        return response.text();
                    })
                    .then((data) => {
                        console.log("Upload successful:", data);
                    })
                    .catch((error) => {
                        console.error("Error uploading video:", error);
                    });
            };

            // Start recording when the user clicks a button
            const recordButton = document.createElement("button");
            recordButton.textContent = "Record";
            recordButton.className = "dos-button"; // Add "dos-button" class
            recordButton.appendChild(counterElement);

            recordButton.onclick = function () {
                mediaRecorder.start();
                const timer = setInterval(function () {
                    timeLeft--;
                    counterElement.textContent = `${timeLeft} seconds left`;
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        mediaRecorder.stop();
                    }
                }, 1000); // Update every second
            };
            contentWindow.appendChild(recordButton);

            // Stop recording when the user clicks another button
            const stopButton = document.createElement("button");
            stopButton.textContent = "Stop";
            stopButton.className = "dos-button"; // Add "dos-button" class
            stopButton.onclick = function () {
                mediaRecorder.stop();
            };
            contentWindow.appendChild(stopButton);
        })
        .catch(function (error) {
            console.error("Error accessing camera:", error);
        });
}
