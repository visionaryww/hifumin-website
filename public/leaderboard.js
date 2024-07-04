document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('.open-sidebar').addEventListener('click', toggleSidebar);

    const rankingsDiv = document.getElementById('rankings');
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.style.display = 'block';

    const currentPath = window.location.pathname;
    if (currentPath === '/leaderboard/collectionscore') {
        displayCollectionScore();
    } else if (currentPath === '/leaderboard/networth') {
        displayNetworth();
    } else if (currentPath === '/leaderboard/cardvalue') {
        displayCardValue();
    } else {
        console.log('Unknown URL path:', currentPath);
    }
});
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
    document.querySelector('.sticky-header').classList.toggle('opened-sidebar');
    toggleMainContent();
}

function toggleMainContent() {
    var sidebar = document.querySelector('.sidebar');
    var content = document.getElementById('rankings');
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

function displayCollectionScore() {
    const rankingsDiv = document.getElementById('rankings');
    const loadingSpinner = document.getElementById('loading-spinner');
    fetch('/api/rankings/collectionscore')
        .then(response => response.json())
        .then(data => {
            loadingSpinner.style.display = 'none';
            rankingsDiv.innerHTML = '';

            data.forEach((user, index) => {
                const { username, score, ranking } = user;
                const scoreFormatted = score.toFixed(2);
                
                const topThree = (index < 3);
                let medalEmoji = '';
                if (topThree) {
                    if (index === 0) medalEmoji = '🥇';
                    else if (index === 1) medalEmoji = '🥈';
                    else if (index === 2) medalEmoji = '🥉';
                }
                const button = document.createElement('button');
                button.classList.add('lb-subcategory-button');
                button.innerHTML = `
                    <span class="ranking">${ranking}.</span>
                    <span class="medal">${medalEmoji}</span>
                    <span class="username">${username}</span>
                    <span class="score">${scoreFormatted}🌟</span>
                `;
                button.addEventListener('click', () => {
                    const url = `/search/user/${username}`;
                    window.location.href = url;
                });

                rankingsDiv.appendChild(button);
            });
        })
        .catch(error => {
            console.error('Error fetching rankings:', error);
        });
}

function displayNetworth() {
    const rankingsDiv = document.getElementById('rankings');
    const loadingSpinner = document.getElementById('loading-spinner');
    fetch('/api/rankings/networth')
        .then(response => response.json())
        .then(data => {
            loadingSpinner.style.display = 'none';
            rankingsDiv.innerHTML = '';

            data.forEach((user, index) => {
                const { username, price, ranking } = user;
                const priceFormatted = Math.round(price);
                
                const topThree = (index < 3);
                let medalEmoji = '';
                if (topThree) {
                    if (index === 0) medalEmoji = '🥇';
                    else if (index === 1) medalEmoji = '🥈';
                    else if (index === 2) medalEmoji = '🥉';
                }
                const button = document.createElement('button');
                button.classList.add('lb-subcategory-button');
                button.innerHTML = `
                    <span class="ranking">${ranking}.</span>
                    <span class="medal">${medalEmoji}</span>
                    <span class="username">${username}</span>
                    <span class="score">${priceFormatted}💰</span>
                `;
                button.addEventListener('click', () => {
                    const url = `/search/user/${username}`;
                    window.location.href = url;
                });

                rankingsDiv.appendChild(button);
            });
        })
        .catch(error => {
            console.error('Error fetching rankings:', error);
        });
}

function displayCardValue() {
    console.log("??XD");
}
