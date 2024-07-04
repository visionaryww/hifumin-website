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

    document.querySelector('.open-sidebar').addEventListener('click', toggleSidebar);

    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.style.display = 'block';
    fetch('/api/rankings/cardvalue')
        .then(response => response.json())
        .then(data => {
            loadingSpinner.style.display = 'none';
            displayResults(data);

        })
        .catch(error => {
            console.error('Error fetching rankings:', error);
        });

});

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
                return -1;
            }
            if (!isLetterA && isLetterB) {
                return 1;
            }
            if (isDigitA && !isDigitB) {
                return 1;
            }
            if (!isDigitA && isDigitB) {
                return -1;
            }
            const comparison = charA.localeCompare(charB, undefined, { numeric: true, sensitivity: 'base' });
            if (comparison !== 0) {
                return comparison ;
            }
        }
    
        return 0;
    });
    results.sort((a, b) => calculateBurnValue(b)  - calculateBurnValue(a) );

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
}


function clearResults() {
    document.getElementById("results").innerHTML = '';
}