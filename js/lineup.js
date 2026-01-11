import { createButton } from "./utils.js";
import { toggleAlert } from "./custom.js";

const contentWindow = document.getElementById("content-window");

export function initLineup(year = "24") {
    console.log("init lineup");
    fetch(`/lineup?year=${year}`)
        .then((response) => response.json())
        .then((data) => {
            contentWindow.innerHTML = "";

            const seebuhneList = document.createElement("div"); // Create a container for Seebühne artists
            seebuhneList.innerHTML = "<h4>Seebühne</h4>";
            const zirkuszeltList = document.createElement("div"); // Create a container for Zirkuszelt artists
            zirkuszeltList.innerHTML = "<h4>Zirkuszelt</h4>";
            const greenPavillionList = document.createElement("div"); // Create a container for WORKSHOPS artists
            greenPavillionList.innerHTML = "<h4>Workshops</h4>";    // greenpavillion ist erstmal workshops ersatz

            data.forEach((artist) => {
<<<<<<< HEAD
                if (artist['artists_show_in_lineup'] === 1) {
                    const artistButton = generateArtistButton(artist);
=======
                // console.log(artist);
                if (artist['artists_show_in_lineup'] === 1) {
                    const artistButton = generateArtistButton(artist);
                    
                    // artists_mainstage 0=zirkuszelt 1=seebühne 2=team green pavillion

                    // Determine which list to append the artist button to
>>>>>>> c3fb85deaec14ed7e2621c07c4e3d5e91474b516
                    if (artist.artists_mainstage === 1) {
                        seebuhneList.appendChild(artistButton); // Add to Seebühne list
                    } else if (artist.artists_mainstage === 0) {
                        zirkuszeltList.appendChild(artistButton); // Add to Zirkuszelt list
                    } else if (artist.artists_mainstage === 2) {
                        greenPavillionList.appendChild(artistButton); // Add to team green pavillion
                    }
                }
            });
            // Create buttons for toggling between ARTISTS and LINEUP
            const artistsButton = createButton("ARTISTS", ["active"]);
            const lineupButton = createButton("LINEUP");
<<<<<<< HEAD
            const timetableOverview = generateTimetableOverview(data, year);
=======
            const timetableOverview = generateTimetableOverview(data);
>>>>>>> c3fb85deaec14ed7e2621c07c4e3d5e91474b516
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
<<<<<<< HEAD
=======
            lineupButton.style.display = "none";
>>>>>>> c3fb85deaec14ed7e2621c07c4e3d5e91474b516

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
            if (year === "25") {
                // only show Seebühne for 2025 artists
                zirkuszeltList.style.display = "none";
                greenPavillionList.style.display = "none";
            } else {
                // show all stages for 2024 artists
                zirkuszeltList.style.display = "block";
                greenPavillionList.style.display = "block";
            }
            listsContainer.appendChild(zirkuszeltList);
            listsContainer.appendChild(greenPavillionList);

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
        // Include artist image if available
        const imgHTML = artist.artists_img
            ? `<img src="${artist.artists_img}" alt="${artist.artists_name}" class="artist-img" style="max-width:256px;height:auto;margin-bottom:1em;"/>`
            : "";

        if (artist.artists_youtube) {
            youtubeLinkHTML = `<p><strong>Link:</strong> <a href="${artist.artists_youtube}" target="_blank">Reinhören</a></p>`;
        }

        const artistInfoHTML = `
                        <div class="artist-info">
                            ${imgHTML}
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
        // "saturday",
        // "sunday",
        // "seebühne",
        // "zirkuszelt",
        // "workshops"
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
            const isStageButton = ["seebühne", "zirkuszelt", "workshops"].includes(label);

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
            // console.log("Active Day Buttons:", Array.from(activeDayButtons));
            // console.log(
            //     "Active Stage Buttons:",
            //     Array.from(activeStageButtons)
            // );
        });
        toggleButtonsContainer.appendChild(button);
    });
    // console.lo("Active Day Buttons:", Array.from(activeDayButtons));
    // console.lo("Active Stage Buttons:", Array.from(activeStageButtons));

    return toggleButtonsContainer;
}

<<<<<<< HEAD
function generateTimetableOverview(data, year = "24") {
=======
function generateTimetableOverview(data) {
>>>>>>> c3fb85deaec14ed7e2621c07c4e3d5e91474b516
    // Sort the data by stage and then by start time
    data.sort((a, b) => {
        // First, compare by stage (mainstage)
        const stageComparison = b.artists_mainstage - a.artists_mainstage;
        if (stageComparison !== 0) {
            return stageComparison;
        }
        // If stages are the same, compare by start time
        return a.artists_start_id - b.artists_start_id;
    });

<<<<<<< HEAD
    // Only show Friday/Seebühne for 2025
    let bandsByDayAndStage;
    if (year === "25") {
        bandsByDayAndStage = {
            Friday: { Seebühne: [] }
        };
        data.forEach((artist) => {
            const day = new Date(artist.artists_start_time).toLocaleDateString("en-US", { weekday: "long" });
            if (day === "Friday" && artist.artists_mainstage === 1) {
                bandsByDayAndStage.Friday.Seebühne.push(artist);
            }
        });
    } else {
        bandsByDayAndStage = {
            Friday: { Seebühne: [], Zirkuszelt: [], Workshops: [] },
            Saturday: { Seebühne: [], Zirkuszelt: [], Workshops: [] },
            Sunday: { Seebühne: [], Zirkuszelt: [], Workshops: [] },
        };
        data.forEach((artist) => {
            const day = new Date(artist.artists_start_time).toLocaleDateString("en-US", { weekday: "long" });
            const stage =
                artist.artists_mainstage === 0 ? "Zirkuszelt" :
                artist.artists_mainstage === 1 ? "Seebühne" :
                artist.artists_mainstage === 2 ? "Workshops" :
                "Unknown Stage";
            if (bandsByDayAndStage[day] && bandsByDayAndStage[day][stage]) {
                bandsByDayAndStage[day][stage].push(artist);
            }
        });
    }
=======
    // Initialize an object to store bands by day and stage
    const bandsByDayAndStage = {
        Friday: { Seebühne: [], Zirkuszelt: [], Workshops: [] },
        Saturday: { Seebühne: [], Zirkuszelt: [], Workshops: [] },
        Sunday: { Seebühne: [], Zirkuszelt: [], Workshops: [] },
    };

    // Populate the bandsByDayAndStage object
    data.forEach((artist) => {
        const day = new Date(artist.artists_start_time).toLocaleDateString(
            "en-US",
            { weekday: "long" }
        );
        const stage =
            artist.artists_mainstage === 0 ? "Zirkuszelt" :
            artist.artists_mainstage === 1 ? "Seebühne" :
            artist.artists_mainstage === 2 ? "Workshops" :
            "Unknown Stage"; // This handles any unexpected values
        bandsByDayAndStage[day][stage].push(artist);
    });
>>>>>>> c3fb85deaec14ed7e2621c07c4e3d5e91474b516

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
<<<<<<< HEAD
                const startTime = new Date(band.artists_start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const endTime = new Date(band.artists_end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                stageDayContainer.appendChild(createButton(`${startTime}`, ["deactivated"]));
=======
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
>>>>>>> c3fb85deaec14ed7e2621c07c4e3d5e91474b516
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