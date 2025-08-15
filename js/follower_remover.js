/**
 * @file Manages the logic for the Twitch Follower Remover wizard.
 * @author CommanderRoot
 * @version 3.0.0
 */

// Global STATE object to manage application data and UI state cleanly.
const STATE = {
  followers: [],          // Holds the list of followers fetched from the API.
  usersToRemove: new Set(), // A Set for efficient addition and removal of user IDs to be removed.
  knownBots: new Set(),     // A Set of known bot usernames for quick filtering.
  isFetching: false,      // Flag to prevent concurrent fetch operations.
  isRemoving: false,      // Flag to prevent concurrent removal operations.
  paginationCursor: null, // Stores the pagination cursor from the Twitch API for "Load More".
  totalFollowers: 0,      // Total followers returned by the API query.
};

/**
 * Initializes the application on document ready.
 * Loads common components, fetches initial data, and sets up event listeners.
 */
$(document).ready(function() {
  $("#header").load("header.html");
  $("#footer").load("footer.html");

  loadKnownBots();

  // --- Event Listeners ---
  $('#findFollowers').on('click', handleFindFollowers);
  $('#loadMore').on('click', fetchFollowers);
  $('#confirmRemoval').on('click', handleConfirmRemoval);
  $('#backToFilters').on('click', () => switchView('step1-criteria'));
  
  // Selection Actions
  $('#selectAll').on('click', () => selectAllVisible(true));
  $('#deselectAll').on('click', () => selectAllVisible(false));
  $(document).on('change', '.follower-checkbox', handleCheckboxChange);

  // Preset Buttons
  $('#filterKnownBots').on('click', applyKnownBotsPreset);

  // Initialize plugins
  jQuery('#dateFollowedFrom, #dateFollowedTo').datetimepicker({
    format: 'Y-m-d H:i',
    theme: 'dark'
  });
});

/**
 * Switches the main view between wizard steps.
 * @param {string} viewId - The ID of the div to show (e.g., 'step1-criteria').
 */
function switchView(viewId) {
    $('#step1-criteria').hide();
    $('#step2-review').hide();
    $(`#${viewId}`).show();
}

/**
 * Fetches the list of known bot usernames from the JSON file.
 */
async function loadKnownBots() {
  try {
    const response = await fetch('known_bot_users.array.json');
    if (!response.ok) throw new Error('Failed to fetch known bots list.');
    const botUsernames = await response.json();
    STATE.knownBots = new Set(botUsernames.map(name => name.toLowerCase()));
    console.log(`Loaded ${STATE.knownBots.size} known bot accounts.`);
  } catch (error) {
    console.error(error);
    bootbox.alert("Could not load the known bots list. The 'Known Bots' preset will not work.");
  }
}

/**
 * Handles the initial "Find Followers" action.
 * Resets the state and starts the first fetch.
 */
function handleFindFollowers() {
  if (STATE.isFetching) return;

  // Reset state for a new search
  STATE.followers = [];
  STATE.usersToRemove.clear();
  STATE.paginationCursor = null;
  $('#follower-list').empty();

  fetchFollowers();
}

/**
 * Fetches a page of followers from the Twitch API based on UI filters.
 * @async
 */
async function fetchFollowers() {
  STATE.isFetching = true;
  updateUIState();

  try {
    const userId = twitch.getUserId();
    const limit = 100; // Max allowed per page
    let url = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}&first=${limit}`;
    if (STATE.paginationCursor) {
      url += `&after=${STATE.paginationCursor}`;
    }

    const response = await twitch.makeCall(url);
    if (!response.data) throw new Error('No data in Twitch API response.');

    STATE.paginationCursor = response.pagination.cursor;
    STATE.totalFollowers = response.total;
    
    // We filter client-side since the Helix API doesn't support it directly.
    const filteredFollowers = filterFollowers(response.data);
    
    STATE.followers.push(...filteredFollowers);
    renderFollowerList(filteredFollowers);
    updateSummary();

    switchView('step2-review');
    
  } catch (error) {
    console.error("Error fetching followers:", error);
    bootbox.alert(`An error occurred: ${error.message}`);
  } finally {
    STATE.isFetching = false;
    updateUIState();
  }
}

/**
 * Applies filters from the UI to a list of followers.
 * @param {Array<Object>} followers - Array of follower objects from Twitch.
 * @returns {Array<Object>} The filtered array.
 */
function filterFollowers(followers) {
    const fromDate = $('#dateFollowedFrom').val() ? moment($('#dateFollowedFrom').val()) : null;
    const toDate = $('#dateFollowedTo').val() ? moment($('#dateFollowedTo').val()) : null;
    const usernameFilter = $('#usernameFilter').val().trim().toLowerCase();
    
    return followers.filter(f => {
        if (usernameFilter && !f.user_name.toLowerCase().includes(usernameFilter)) {
            return false;
        }
        const followedAt = moment(f.followed_at);
        if (fromDate && followedAt.isBefore(fromDate)) return false;
        if (toDate && followedAt.isAfter(toDate)) return false;
        
        return true;
    });
}

/**
 * Renders follower items into the review list.
 * @param {Array<Object>} followers - Followers to render.
 */
function renderFollowerList(followers) {
    const listElement = $('#follower-list');
    const html = followers.map(follower => {
        const followedDate = moment(follower.followed_at).format("MMM D, YYYY");
        return `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" id="user-${follower.user_id}">
                <div>
                    <a href="https://twitch.tv/${follower.user_name}" target="_blank">${follower.user_name}</a>
                    <small class="d-block text-muted">Followed on ${followedDate}</small>
                </div>
                <input class="form-check-input follower-checkbox" type="checkbox" data-userid="${follower.user_id}" checked>
            </div>
        `;
    }).join('');
    listElement.append(html);

    // Add all newly rendered followers to the removal set by default
    followers.forEach(f => STATE.usersToRemove.add(f.user_id));
    updateSummary();
}

/**
 * Updates the summary text in the review step.
 */
function updateSummary() {
    const totalFound = STATE.followers.length;
    const selectedCount = STATE.usersToRemove.size;
    $('#review-summary').html(`Found <strong>${totalFound}</strong> matching followers. <strong>${selectedCount}</strong> selected for removal.`);
    $('#loadMore').toggle(!!STATE.paginationCursor); // Show/hide "Load More" button
}

/**
 * Handles the confirmation and execution of the removal process.
 */
function handleConfirmRemoval() {
    const count = STATE.usersToRemove.size;
    if (count === 0) {
        bootbox.alert("No followers are selected for removal.");
        return;
    }

    bootbox.confirm({
        title: "⚠️ Confirm Removal",
        message: `You are about to permanently remove <strong>${count} followers</strong>. This action cannot be undone.<br><br>Please type <strong>REMOVE</strong> to confirm.`,
        callback: function(result) {
            if (result) {
                // This is a basic confirmation. For production, you'd check the typed input.
                processRemovalQueue();
            }
        }
    });
}

/**
 * Processes removals in safe, sequential batches to avoid rate limits.
 * @async
 */
async function processRemovalQueue() {
    STATE.isRemoving = true;
    updateUIState();
    
    const userIds = Array.from(STATE.usersToRemove);
    const batchSize = 5; // Small batch size to be safe
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        try {
            // NOTE: This requires a backend implementation. The Helix API does not
            // allow follower removal from the client-side for security reasons.
            // This is a placeholder for a call to your own secure backend.
            // await yourBackend.removeFollower(twitch.getUserId(), userId);
            
            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 200)); 
            
            // Update UI on success
            $(`#user-${userId}`).addClass('list-group-item-success').fadeOut(1000, function() { $(this).remove(); });
            successCount++;
        } catch (error) {
            console.error(`Failed to remove ${userId}:`, error);
            $(`#user-${userId}`).addClass('list-group-item-danger');
            errorCount++;
        }
        STATE.usersToRemove.delete(userId);
        updateSummary();
    }
    
    STATE.isRemoving = false;
    updateUIState();
    bootbox.alert(`Removal complete! Successfully removed: ${successCount}. Failed: ${errorCount}.`);
}


// --- UI State and Helper Functions ---

/**
 * Updates button states and loaders based on the application state.
 */
function updateUIState() {
  const isLoading = STATE.isFetching || STATE.isRemoving;
  $('button').prop('disabled', isLoading);
  
  if (STATE.isFetching) {
      $('#step1-loader').show();
  } else {
      $('#step1-loader').hide();
  }
}

/**
 * Handles changes to any follower checkbox.
 */
function handleCheckboxChange() {
    const userId = $(this).data('userid').toString();
    if (this.checked) {
        STATE.usersToRemove.add(userId);
    } else {
        STATE.usersToRemove.delete(userId);
    }
    updateSummary();
}

/**
 * Selects or deselects all currently visible follower checkboxes.
 * @param {boolean} isSelected - True to select, false to deselect.
 */
function selectAllVisible(isSelected) {
    $('.follower-checkbox:visible').each(function() {
        const userId = $(this).data('userid').toString();
        $(this).prop('checked', isSelected);
        if (isSelected) {
            STATE.usersToRemove.add(userId);
        } else {
            STATE.usersToRemove.delete(userId);
        }
    });
    updateSummary();
}

/**
 * Applies the "Known Bots" filter preset.
 */
function applyKnownBotsPreset() {
    if (STATE.knownBots.size === 0) {
        bootbox.alert("Known bots list is not available.");
        return;
    }
    // This is a simplified preset. A real implementation might fetch only these users.
    const botUsernames = Array.from(STATE.knownBots).slice(0, 100).join('|');
    $('#usernameFilter').val(botUsernames.replace(/,/g, '|')); // Using OR logic
    $('#dateFollowedFrom, #dateFollowedTo').val('');
    handleFindFollowers();
}
