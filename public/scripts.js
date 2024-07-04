document.addEventListener('DOMContentLoaded', function () {
    
    var modal = document.getElementById("card-modal");
    var span = document.getElementsByClassName("close")[0];

    span.onclick = function() {
        modal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    document.getElementById("sortButton").addEventListener("click", toggleSortDirection);

    document.getElementById('search-form').addEventListener('submit', function(event) {
        event.preventDefault();
        search();
    });

    document.querySelector('.open-sidebar').addEventListener('click', toggleSidebar);


    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');

    if (pathSegments.length === 4 && pathSegments[1] === 'search') {
        const type = pathSegments[2];
        const searchTerm = decodeURIComponent(pathSegments[3]);

        if (type === 'user') {
            document.getElementById("search-bar").value = searchTerm;
            searchUser();
            search();
        } else if (type === 'card') {
            document.getElementById("search-bar").value = searchTerm;
            searchCard();
            search();
        } else {
            console.log('Unknown URL path:', currentPath);
        }
    } else {
        console.log('Unknown URL path:', currentPath);
    }

    window.addEventListener('popstate', function(event) {
        if (event.state) {
            const { username, searchType } = event.state;
            document.getElementById("search-bar").value = username;

            if (searchType === 'user') {
                searchUser();
                search();
            } else if (searchType === 'card') {
                searchCard();
                search();
            }
        }
    });
});

var ascending = true;
var currentSortMethod = 'value';
var searchType = 'user';
var lastDisplayedCards = [];

function toggleSortDirection() {
    const sortButton = document.getElementById("sortButton");
    sortButton.classList.toggle("up");
    sortButton.classList.toggle("down");
    ascending = !ascending;
    sortResults(currentSortMethod);
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
    document.querySelector('.sticky-header').classList.toggle('opened-sidebar');
    toggleMainContent();
}

function toggleMainContent() {
    var sidebar = document.querySelector('.sidebar');
    var content = document.getElementById('results');
    content.style.marginLeft = sidebar.classList.contains('open') ? "250px" : "0";
}

function openTab(tabName) {
    var subcategories = document.getElementsByClassName("subcategory");
    for (var i = 0; i < subcategories.length; i++) {
        subcategories[i].classList.remove("active");
    }

    var subcategory = document.getElementById(tabName + "-subcategory");
    subcategory.classList.add("active");
    
}

function searchUser() {
    searchType = 'user';
    var searchBar = document.getElementById('search-bar');
    searchBar.placeholder = 'Search by Discord';
    clearResults();
    updateSearchButtonText("Search: User");
}

function searchCard() {
    searchType = 'card';
    var searchBar = document.getElementById('search-bar');
    searchBar.placeholder = 'Search by Username';
    clearResults();
    updateSearchButtonText("Search: Card");
}

function showCardValue() {
    alert("Not implemented yet...");
}

function showProfileNetWorth() {
    alert("Not implemented yet...");
}

function showWeightedProfileValue() {
    alert("Not implemented yet...");
}

function search() {
    var resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = '';
    var username = document.getElementById("search-bar").value.trim();
    if (username === '') {
        alert('Please enter a username');
        return;
    }

    var url = searchType === 'user' ? `/searchUserCollection?username=${username}` : `/searchCards?username=${username}`;
    
    var spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';

    fetch(url)
    .then(response => response.json())
    .then(data => {
        displayResults(data);
        updateURL(username, searchType);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    })
    .finally(() => {
        spinner.style.display = 'none';
    });
}

function updateURL(username, searchType) {
    var newURL = searchType === 'user' ? `/search/user/${username}` : `/search/card/${username}`;
    var currentURL = window.location.pathname + window.location.search;

    if (newURL !== currentURL) {
        history.pushState({ username: username, searchType: searchType }, null, newURL);
    }
}


function qualityToEmoji(quality) {
    switch (quality) {
        case 'BadlyDamaged': return '💥';
        case 'Poor': return '⚠️';
        case 'Good': return '✔️';
        case 'Mint': return '💎';
        default: return '';
    }
}
function showDetails(img, name, quality, card_id, owned_by, burn_value, rarity, foil) {
    var modal = document.getElementById("card-modal");
    var cardDetails = document.getElementById("card-details");

    var rarityClass = '';

    var foilClass = foil == 1 ? 'foil' : '';

    var starRating = '';
    if (rarity >= 40) {
        starRating = '⭐⭐⭐';
        rarityClass = 'star3';
    } else if (rarity >= 20) {
        starRating = '⭐⭐';
        rarityClass = 'star2';
    } else {
        starRating = '⭐';
        rarityClass = 'star1';
    }

    cardDetails.innerHTML = `
        <div class="details-container">
            <div class="close-button" onclick="closeModal()">&times;</div>
            <div class="card-image ${rarityClass} ${foilClass}">
                <div class="image-container">
                    <img src="${img}" style="width: 100%; height: 100%;">
                    <div class="star-overlay">${starRating}</div>
                </div>
            </div>
            <div class="details">
                <h2><a href="/search/card/${name}" onclick="redirectInModal_card('${name}')">${name}</a> ${qualityToEmoji(quality)}</h2>
                <h4><i>${card_id}</i></h3>
                <div class="details-info">
                    <p><strong><br>Burn Value:</strong> 💰${burn_value}</p>
                    <p><strong>Rarity:</strong> ${rarity}</p>
                    <p><strong>Owned by:</strong> <a href="/search/user/${owned_by}" onclick="redirectInModal_user('${owned_by}')">${owned_by}</a></p>
                </div>
            </div>
        </div>`;

    modal.style.display = "block";
}

function redirectInModal_user(user_id) {
    closeModal();
    searchUser();
    document.getElementById("search-bar").value = user_id;
    search();
}

function redirectInModal_card(card_name) {
    closeModal();
    searchCard();
    document.getElementById("search-bar").value = card_name;
    search();
}

function closeModal() {
    var modal = document.getElementById("card-modal");
    modal.style.display = "none";
}

function calculateBurnValue(card) {
    var conditionMultiplier = 0;
    switch (card.condition) {
        case 'BadlyDamaged': conditionMultiplier = 0.1; break;
        case 'Poor': conditionMultiplier = 0.25; break;
        case 'Good': conditionMultiplier = 0.5; break;
        case 'Mint': conditionMultiplier = 1.497; break;
    }
    var foilMultiplier = (card.foil ? 2 : 1);
    return Math.ceil(5 * conditionMultiplier * card.rarity * foilMultiplier);
}

function displayResults(results) {
    var resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = '';
    var direction = ascending ? 1 : -1;

    results.sort((a, b) => { // tiebreak by id
        const idA = a.id;
        const idB = b.id;
        const length = Math.max(idA.length, idB.length);
    
        for (let i = 0; i < length; i++) {
            const charA = idA[i] || '';
            const charB = idB[i] || '';
    
            const isDigitA = /\d/.test(charA);
            const isDigitB = /\d/.test(charB);
            const isLetterA = /[a-zA-Z]/.test(charA);
            const isLetterB = /[a-zA-Z]/.test(charB);
    
            if (isLetterA && !isLetterB) {
                return -1 * direction;
            }
            if (!isLetterA && isLetterB) {
                return 1 * direction;
            }
            if (isDigitA && !isDigitB) {
                return 1 * direction;
            }
            if (!isDigitA && isDigitB) {
                return -1 * direction;
            }
            const comparison = charA.localeCompare(charB, undefined, { numeric: true, sensitivity: 'base' });
            if (comparison !== 0) {
                return comparison * direction;
            }
        }
    
        return 0;
    });
    if (currentSortMethod === 'username') {
        results.sort((a, b) => a.username.localeCompare(b.username) * direction);
    } else if (currentSortMethod === 'condition') {
        const conditionOrder = {
            'BadlyDamaged': 3,
            'Poor': 2,
            'Good': 1,
            'Mint': 0
        };
        results.sort((a, b) => conditionOrder[a.condition] * direction - conditionOrder[b.condition] * direction);
    } else if (currentSortMethod === 'value') {
        results.sort((a, b) => calculateBurnValue(b) * direction - calculateBurnValue(a) * direction);
    } else if (currentSortMethod === 'rarity') {
        results.sort((a, b) => b.rarity * direction - a.rarity * direction);
    }
    

    results.forEach(result => {
        if (result.owner_id === null) {
            return;
        }

        var card = document.createElement("div");
        card.className = 'card';
        if (result.foil === 1) card.classList.add('foil');

        if (result.rarity >= 40) {
            card.classList.add('star3');
        } else if (result.rarity >= 20) {
            card.classList.add('star2');
        } else {
            card.classList.add('star1');
        }

        var burnValue = calculateBurnValue(result);
        card.innerHTML = `
            <img src="${result.avatar_url}" onclick="showDetails('${result.avatar_url}', '${result.username}', '${result.condition}', '${result.id}', '${result.discord_username}', '${burnValue}', '${result.rarity}', '${result.foil}')">
            <div class="name-box" data-text="${result.username}${qualityToEmoji(result.condition)}">${result.username}${qualityToEmoji(result.condition)}</div>
            <div class="card-id">${result.id}</div>
            <div class="value">💰${burnValue}</div>
        `;
        
        resultsContainer.appendChild(card);
    });

    lastDisplayedCards = results.slice();
    const profileNameElem = document.getElementById("profile-name");
    const profileCsElem = document.getElementById("profile-cs");
    const profileRankingElem = document.getElementById("profile-ranking");

    if (searchType === 'user' && results.length != 0) {
        profileNameElem.style.display = 'block';
        profileNameElem.textContent = `User: ${results[0].discord_username}`;

        profileCsElem.style.display = 'block';
        searchUserRanking(results[0].discord_username);
    } else {
        profileNameElem.style.display = 'none';
        profileCsElem.style.display = 'none';
        profileRankingElem.style.display = 'none';
    }
}

function searchUserRanking(username) {
    fetch(`/api/rankings/search?username=${encodeURIComponent(username)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateProfileCs(data.score.toFixed(2));
            updateProfileRanking(data.ranking);
        })
        .catch(error => {
            console.error('Error searching for username:', error);
        });
}

function updateProfileCs(score) {
    const profileCsElem = document.getElementById("profile-cs");
    profileCsElem.textContent = `CS: ${score}`;
}

function updateProfileRanking(ranking) {
    const profileRankingElem = document.getElementById("profile-ranking");
    profileRankingElem.style.display = 'block';
    profileRankingElem.textContent = `#${ranking}`;
}

function clearResults() {
    document.getElementById("results").innerHTML = '';
}

function updateSearchButtonText(text) {
    document.getElementById('search-dropdown-btn').textContent = text;
}

function sortResults(method) {
    currentSortMethod = method;
    updateSortButton();
    displayResults(lastDisplayedCards);
}

function updateSortButton() {
    const sortButton = document.getElementById('sort-dropdown-btn');
    switch (currentSortMethod) {
        case 'card-id': sortButton.textContent = 'Sort: Card ID'; break;
        case 'username': sortButton.textContent = 'Sort: Username'; break;
        case 'condition': sortButton.textContent = 'Sort: Condition'; break;
        case 'value': sortButton.textContent = 'Sort: Value'; break;
        case 'rarity': sortButton.textContent = 'Sort: Rarity'; break;
    }
}

updateSortButton();