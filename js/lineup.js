import { createButton } from "./utils.js";
import { toggleAlert } from "./custom.js";

const contentWindow = document.getElementById("content-window");

export function initLineup() {
    console.log("init lineup");
    fetch("/lineup")
        .then((response) => response.json())
        .then((data) => {
            contentWindow.innerHTML = "";

            const seebuhneList = document.createElement("div"); // Create a container for Seebühne artists
            seebuhneList.innerHTML = "<h4>Seebühne</h4>";
            const zirkuszeltList = document.createElement("div"); // Create a container for Zirkuszelt artists
            zirkuszeltList.innerHTML = "<h4>Zirkuszelt</h4>";

            data.forEach((artist) => {
                const artistButton = generateArtistButton(artist);

                // Determine which list to append the artist button to
                if (artist.artists_mainstage === 1) {
                    seebuhneList.appendChild(artistButton); // Add to Seebühne list
                } else {
                    zirkuszeltList.appendChild(artistButton); // Add to Zirkuszelt list
                }
            });
            // Create buttons for toggling between ARTISTS and LINEUP
            const artistsButton = createButton("ARTISTS", ["active"]);
            const lineupButton = createButton("LINEUP", ["deactivated"]);
            lineupButton.disabled = true;
            const timetableOverview = generateTimetableOverview(data);
            timetableOverview.classList.add("timetable-container"); // Add a specific classname to the timetable overview
            const listsContainer = document.createElement("div");
            listsContainer.classList.add("artists-container"); // Add a specific classname to the lists container

            // Add event listeners to the buttons
            artistsButton.addEventListener("click", () => {
                artistsButton.classList.add("active");
                lineupButton.classList.remove("active");
                timetableOverview.style.display = "none";
                listsContainer.style.display = "block";
            });

            lineupButton.addEventListener("click", () => {
                lineupButton.classList.add("active");
                artistsButton.classList.remove("active");
                listsContainer.style.display = "none";
                timetableOverview.style.display = "block";
            });

            // Create a container for the toggle buttons
            const toggleButtonsContainer = document.createElement("div");
            toggleButtonsContainer.classList.add("toggle-buttons-container");
            // Apply CSS styles to center the toggle buttons horizontally
            toggleButtonsContainer.style.textAlign = "center";

            // Append buttons to the toggle buttons container
            toggleButtonsContainer.appendChild(artistsButton);
            toggleButtonsContainer.appendChild(lineupButton);

            // Append the toggle buttons container to the contentWindow
            contentWindow.appendChild(toggleButtonsContainer);
            // Append timetable to the contentWindow
            contentWindow.appendChild(timetableOverview);

            // Create a div for the lists

            // Append the lists to the lists container
            listsContainer.appendChild(seebuhneList);
            listsContainer.appendChild(zirkuszeltList);

            // Append the lists container to the contentWindow
            contentWindow.appendChild(listsContainer);

            // Initially display the timetable overview and hide the lists container
            timetableOverview.style.display = "none";
            listsContainer.style.display = "block";
        })
        .catch((error) => {
            console.error("Error fetching lineup:", error);
        });
}

function generateArtistButton(artist) {
    const artistButton = document.createElement("button");
    artistButton.className = "dos-button";
    artistButton.textContent = artist.artists_name;

    artistButton.addEventListener("click", () => {
        let youtubeLinkHTML = "";
        if (artist.artists_youtube) {
            youtubeLinkHTML = `<p><strong>Link:</strong> <a href="${artist.artists_youtube}" target="_blank">Reinhören</a></p>`;
        }

        const artistInfoHTML = `
                        <div class="artist-info">
                            <h2 style="text-transform: uppercase;">${artist.artists_name}</h2>
                            <p><strong>Genre:</strong> ${artist.artists_genre}</p>
                            <p><strong>Base:</strong> ${artist.artists_from}</p>
                            ${youtubeLinkHTML}
                            <p>${artist.artists_info}</p>
                            <!-- Add more info here as needed -->
                        </div>
                    `;
        toggleAlert(artistInfoHTML);
    });
    return artistButton;
}

function generateToggleButtons() {
    const toggleButtonsContainer = document.createElement("div");

    // Define button texts
    const buttonLabels = [
        "friday",
        "saturday",
        "sunday",
        "seebühne",
        "zirkuszelt",
    ];

    // Initialize filter states
    const activeDayButtons = new Set(buttonLabels.slice(0, 3)); // Add first three buttons (day buttons)
    const activeStageButtons = new Set(buttonLabels.slice(3)); // Add last two buttons (stage buttons)

    // Create buttons
    buttonLabels.forEach((label) => {
        const button = createButton(label, ["active"]);
        button.addEventListener("click", () => {
            // Toggle visibility based on button label
            const isDayButton = ["friday", "saturday", "sunday"].includes(
                label
            );
            const isStageButton = ["seebühne", "zirkuszelt"].includes(label);

            // Toggle active state of the button
            button.classList.toggle("active");

            // Update filter states based on button type
            if (isDayButton) {
                if (button.classList.contains("active")) {
                    activeDayButtons.add(label.toLowerCase());
                } else {
                    activeDayButtons.delete(label.toLowerCase());
                }
            }

            if (isStageButton) {
                if (button.classList.contains("active")) {
                    activeStageButtons.add(label);
                } else {
                    activeStageButtons.delete(label);
                }
            }

            // Apply filters
            const timetableContainers =
                document.querySelectorAll(".timetable-entry");
            timetableContainers.forEach((container) => {
                const isDayMatch =
                    activeDayButtons.size === 0 ||
                    activeDayButtons.has(container.dataset.day);
                const isStageMatch =
                    activeStageButtons.size === 0 ||
                    activeStageButtons.has(container.dataset.stage);
                container.classList.toggle(
                    "hidden",
                    !(isDayMatch && isStageMatch)
                );
            });
            console.log("Active Day Buttons:", Array.from(activeDayButtons));
            console.log(
                "Active Stage Buttons:",
                Array.from(activeStageButtons)
            );
        });
        toggleButtonsContainer.appendChild(button);
    });
    console.log("Active Day Buttons:", Array.from(activeDayButtons));
    console.log("Active Stage Buttons:", Array.from(activeStageButtons));

    return toggleButtonsContainer;
}

function generateTimetableOverview(data) {
    // Sort the data by stage and then by start time
    data.sort((a, b) => {
        // First, compare by stage (mainstage)
        const stageComparison = b.artists_mainstage - a.artists_mainstage;
        if (stageComparison !== 0) {
            return stageComparison;
        }
        // If stages are the same, compare by start time
        return new Date(a.artists_start_time) - new Date(b.artists_start_time);
    });

    // Initialize an object to store bands by day and stage
    const bandsByDayAndStage = {
        Friday: { Seebühne: [], Zirkuszelt: [] },
        Saturday: { Seebühne: [], Zirkuszelt: [] },
        Sunday: { Seebühne: [], Zirkuszelt: [] },
    };

    // Populate the bandsByDayAndStage object
    data.forEach((artist) => {
        const day = new Date(artist.artists_start_time).toLocaleDateString(
            "en-US",
            { weekday: "long" }
        );
        const stage =
            artist.artists_mainstage === 1 ? "Seebühne" : "Zirkuszelt";
        bandsByDayAndStage[day][stage].push(artist);
    });

    // Generate HTML for the timetable overview
    let timetableContainer = document.createElement("div");
    timetableContainer.classList.add("timetable");
    timetableContainer.appendChild(document.createElement("hr"));

    // Generate toggle buttons
    const toggleButtons = generateToggleButtons();

    for (const day in bandsByDayAndStage) {
        for (const stage in bandsByDayAndStage[day]) {
            const stageDayContainer = document.createElement("div");
            stageDayContainer.classList.add(
                "timetable-entry",
                day.toLowerCase(),
                stage.toLowerCase()
            );

            // Set dataset attributes for day and stage
            stageDayContainer.dataset.day = day.toLowerCase();
            stageDayContainer.dataset.stage = stage.toLowerCase();

            const dayHeader = document.createElement("h4");
            dayHeader.textContent = `${stage} - ${day}`;
            stageDayContainer.appendChild(dayHeader);
            bandsByDayAndStage[day][stage].forEach((band) => {
                const startTime = new Date(
                    band.artists_start_time
                ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
                const endTime = new Date(
                    band.artists_end_time
                ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
                stageDayContainer.appendChild(
                    createButton(`${startTime}`, ["deactivated"])
                );
                const artistButton = generateArtistButton(band);
                stageDayContainer.appendChild(artistButton);
                stageDayContainer.appendChild(document.createElement("br"));
            });
            timetableContainer.appendChild(stageDayContainer);
            timetableContainer.appendChild(document.createElement("hr"));
        }
    }

    // Return the div element containing the timetable HTML and toggle buttons
    const timetableOverview = document.createElement("div");
    timetableOverview.appendChild(toggleButtons);
    timetableOverview.appendChild(timetableContainer);
    return timetableOverview;
}