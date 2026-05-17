document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type = "success") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants section
        let participantsHTML = "<div class='participants-section'><strong>Participants:</strong>";
        if (details.participants.length > 0) {
          participantsHTML += "<ul class='participants-list'>";
          details.participants.forEach(participant => {
            participantsHTML += `
              <li>
                <span>${participant}</span>
                <button
                  type="button"
                  class="delete-participant-btn"
                  data-activity="${name}"
                  data-email="${participant}"
                  aria-label="Unregister ${participant} from ${name}"
                  title="Unregister participant"
                >
                  ✕
                </button>
              </li>
            `;
          });
          participantsHTML += "</ul>";
        } else {
          participantsHTML += " <span class='no-participants'>No one signed up yet.</span>";
        }
        participantsHTML += "</div>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Register delete handlers after cards are rendered.
      document.querySelectorAll(".delete-participant-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const clickedButton = event.currentTarget;
          const activityName = clickedButton.dataset.activity;
          const participantEmail = clickedButton.dataset.email;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participantEmail)}`,
              {
                method: "DELETE",
              }
            );

            const result = await response.json();

            if (!response.ok) {
              showMessage(result.detail || "Failed to unregister participant", "error");
              return;
            }

            showMessage(result.message, "success");
            await fetchActivities();
          } catch (error) {
            showMessage("Failed to unregister participant. Please try again.", "error");
            console.error("Error unregistering participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
