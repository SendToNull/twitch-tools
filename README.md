# Twitch Tools

Welcome to **Twitch Tools**, a modernized and refactored suite of client-side utilities designed to help Twitch streamers and moderators manage their communities with greater efficiency and ease. This project provides powerful tools that interact directly with the Twitch API, all wrapped in a clean, user-friendly interface.

---

## ✨ Features

-   **Intuitive UX**: A complete user experience overhaul, moving from dense data tables to guided, step-by-step wizards.
-   **Follower Remover Wizard**: Safely and efficiently find and remove followers based on powerful filters.
    -   **Filter Presets**: One-click filters for "Known Bots" and "Recent Followers."
    -   **Custom Filtering**: Filter by follow date range and username patterns.
    -   **Review & Refine**: A dedicated step to review all matched followers before taking action.
    -   **Safe Removal Process**: Enhanced confirmation and batched API calls to prevent errors and rate-limiting.
-   **Performance Focused**: Refactored JavaScript that is faster, more efficient, and easier to maintain.
-   **Secure Authentication**: All interactions with the Twitch API are handled securely on the client-side using Twitch's recommended authentication flow. Your credentials are never stored.
-   **Well-Documented Code**: The codebase has been thoroughly commented and structured for easy understanding and future development.

---

## 🚀 Getting Started

Because these tools interact with the Twitch API, they must be run from a web server. You cannot simply open the `index.html` file from your local filesystem due to browser security policies (CORS).

### Prerequisites

-   A modern web browser (Chrome, Firefox, Edge, etc.)
-   Python 3 (for the simplest local server setup)

### How to Run Locally

1.  **Clone or Download the Repository**
    -   Download the project files as a ZIP and extract them to a folder on your computer.

2.  **Navigate to the Project Directory**
    -   Open your terminal or command prompt (like Terminal on macOS or PowerShell on Windows).
    -   Use the `cd` command to navigate into the project folder you just created.
    ```sh
    cd path/to/twitch-tools
    ```

3.  **Start the Local Web Server**
    -   Run the following command in your terminal. This will start a simple web server on port 8000.
    ```sh
    python -m http.server 8000
    ```
    -   You should see a message like `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...`

4.  **Open the Tool in Your Browser**
    -   Open your web browser and navigate to the following address:
    -   **`http://localhost:8000`**

You should now see the Twitch Tools landing page and be able to use the tools.

---

## 🛠️ How to Use

### Authentication

Before using any tool, you must first authenticate with your Twitch account.

1.  Click the **"Login with Twitch"** button in the header.
2.  A Twitch pop-up window will appear asking you to authorize the application.
3.  Review the requested permissions and click **"Authorize"**.
4.  Once authorized, your Twitch username will appear in the header, and you can now use the tools.

### Follower Remover Tool

This tool guides you through a safe, three-step process to remove unwanted followers.

**Step 1: Define Criteria**
-   First, decide *how* you want to find followers. You are not shown a massive list upfront.
-   Use a **Preset** like "Known Bots" for a quick start, or define your own **Custom Filters** using date ranges or username text.
-   Click **"Find Followers"** to proceed.

**Step 2: Review & Refine Selection**
-   The tool will fetch only the followers that match your criteria from Step 1.
-   They are presented in a clear list. By default, all found followers are selected for removal.
-   You can **deselect** any users you wish to keep. Use the "Select All" and "Deselect All" buttons for quick changes.
-   If there are more followers to load, a **"Load More"** button will appear.

**Step 3: Confirm & Remove**
-   Click the **"Remove Selected Followers"** button.
-   A confirmation box will appear. To prevent accidents, you must type `REMOVE` to confirm the action.
-   The tool will then begin processing the removals in safe, small batches, providing real-time feedback on its progress.

⚠️ **Important Security Note**: The final step of removing a follower requires an API call that Twitch does not permit from a client-side application for security reasons. The provided code simulates this step. For a fully functional, production-ready version, the `removeFollower` function in `js/follower_remover.js` would need to be modified to call a secure backend service that you control, which would then make the authenticated API call to Twitch.

---

## 💻 Technology Stack

-   **Frontend**: HTML5, CSS3, JavaScript (ES6+)
-   **Frameworks/Libraries**:
    -   [Bootstrap 5](https://getbootstrap.com/): For responsive UI components.
    -   [jQuery](https://jquery.com/): For DOM manipulation and event handling.
    -   [Moment.js](https://momentjs.com/): For easy date and time formatting.
    -   [Bootbox.js](http://bootboxjs.com/): For creating programmatic dialog boxes.
    -   [jQuery DateTimePicker](https://xdsoft.net/jqplugins/datetimepicker/): For the date selection UI.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
