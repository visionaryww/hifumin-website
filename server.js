const mysql = require('mysql2');

require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/cardleaderboard.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cardleaderboard.js'));
});

app.get('/leaderboard/cardvalue', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cardleaderboard.html'));
});

app.get('/leaderboard.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leaderboard.js'));
});

app.get('/leaderboard/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.get('/scripts.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scripts.js'));
});

app.get('/search/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const CACHE_TIME = 5 * 60 * 1000; 
let lastFetchTimeCS = null;
let cachedRankingsCS = null;
let lastFetchTimeNW = null;
let cachedRankingsNW = null;

const sql_username = process.env.SQL_USERNAME;
const sql_password = process.env.SQL_PASSWORD;
const sql_host = process.env.SQL_HOST;
const sql_port = process.env.SQL_PORT;

const pool = mysql.createPool({
    host: sql_host,
    user: sql_username,
    password: sql_password,
    database: 'hifumin',
    port: sql_port,
    supportBigNumbers: true
});

app.get('/searchUserCollection', (req, res) => {
    const username = req.query.username.trim();
    const query = `
    SELECT      card.id,
                mapper_id,
                owner_id,
                claimed_by_id,
                dropped_by_id,
                card.username,
                card.avatar_url,
                created_at,
                foil,
                \`condition\`,
                d.username AS discord_username,
                mapper.rarity
    FROM        card
    INNER JOIN  discord_user AS d
    ON          owner_id = d.id
    INNER JOIN  mapper
    ON          card.mapper_id = mapper.id
    WHERE       burned = false
    AND         (
                owner_id = ?
    OR          d.username = ?);`;
    pool.query(query, [username, username], (err, results) => {
        if (err) {
            console.error('Database query failed:', err);
            return;
        }
        res.json(results);
    });
});

app.get('/searchCards', (req, res) => {
    const username = req.query.username.trim();
    const query = `
    SELECT      card.id,
                mapper_id,
                owner_id,
                claimed_by_id,
                dropped_by_id,
                card.username,
                card.avatar_url,
                created_at,
                foil,
                \`condition\`,
                d.username AS discord_username,
                mapper.rarity
    FROM        card
    INNER JOIN  discord_user AS d
    ON          owner_id = d.id
    INNER JOIN  mapper
    ON          card.mapper_id = mapper.id
    WHERE       burned = false
    AND         card.username = ?;`;

    pool.query(query, [username], (err, results) => {
        if (err) {
            console.error('Database query failed:', err);
            return;
        }

        res.json(results);
    });
});

function calculateScore(cards) {
  return cards
    .map(calculateBurnValue)
    .sort((a, b) => b - a)
    .map((value, index) => value * Math.pow(0.95, index))
    .reduce((acc, value) => acc + value, 0);
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

app.get('/api/rankings/collectionscore', (req, res) => {
    const currentTime = new Date();

    if (cachedRankingsCS && lastFetchTimeCS && (currentTime - lastFetchTimeCS < CACHE_TIME)) {
        res.json(cachedRankingsCS);
    } else {
        const query = `
        SELECT card.id, mapper_id, owner_id,
        card.username, foil, \`condition\`,
        d.username AS discord_username, mapper.rarity
        FROM card
        INNER JOIN discord_user AS d ON owner_id = d.id
        INNER JOIN mapper ON card.mapper_id = mapper.id
        WHERE burned = false
        ORDER BY discord_username;`;

        pool.query(query, (error, results) => {
            if (error) {
                console.error('Error fetching user collection scores:', error);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                const collections = {};
                results.forEach(row => {
                    const username = row.discord_username;
                    if (!collections[username]) {
                        collections[username] = [];
                    }
                    collections[username].push(row);
                });

                const usersWithScores = [];
                Object.keys(collections).forEach(username => {
                    const cards = collections[username];
                    const score = calculateScore(cards);
                    usersWithScores.push({ username, score });
                });

                usersWithScores.sort((a, b) => b.score - a.score);

                usersWithScores.forEach((user, index) => {
                    user.ranking = index + 1;
                });

                cachedRankingsCS = usersWithScores;
                lastFetchTimeCS = new Date();

                res.json(usersWithScores);
            }
        });
    }
});

app.get('/api/rankings/networth', (req, res) => {
    const currentTime = new Date();

    if (cachedRankingsNW && lastFetchTimeNW && (currentTime - lastFetchTimeNW < CACHE_TIME)) {
        res.json(cachedRankingsNW);
    } else {
        const query = `
        SELECT *
        FROM networth_leaderboard
        ORDER BY price DESC;`;

        pool.query(query, (error, results) => {
            if (error) {
                console.error('Error fetching user networth:', error);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                results.sort((a, b) => b.price - a.price);

                results.forEach((user, index) => {
                    user.ranking = index + 1;
                });

                cachedRankingsNW = results;
                lastFetchTimeNW = new Date();

                res.json(results);
            }
        });
    }
});

app.get('/api/rankings/cardvalue', (req, res) => {
    const currentTime = new Date();

    if (cachedRankingsNW && lastFetchTimeNW && (currentTime - lastFetchTimeNW < CACHE_TIME)) {
        res.json(cachedRankingsNW);
    } else {
        const query = `
        SELECT card.id,
               card.mapper_id,
               card.owner_id,
               card.claimed_by_id,
               card.dropped_by_id,
               card.username,
               card.avatar_url,
               card.created_at,
               card.foil,
               card.\`condition\`,
               d.username AS discord_username,
               mapper.rarity
        FROM (
            SELECT *
            FROM card_leaderboard
            ORDER BY price DESC
            LIMIT 250
        ) AS top_cards
        INNER JOIN card ON top_cards."card id" = card.id
        INNER JOIN discord_user AS d ON card.owner_id = d.id
        INNER JOIN mapper ON card.mapper_id = mapper.id
        WHERE card.burned = false;`;

        pool.query(query, (error, results) => {
            if (error) {
                console.error('Error fetching card leaderboard:', error);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                results.sort((a, b) => b.price - a.price);

                results.forEach((user, index) => {
                    user.ranking = index + 1;
                });

                cachedRankingsNW = results;
                lastFetchTimeNW = new Date();

                res.json(results);
                console.log(results);
            }
        });
    }
});

app.get('/api/rankings/search', (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username parameter is required' });
    }

    if (!cachedRankingsCS) {
        return res.status(404).json({ error: 'Leaderboard data not available' });
    }

    const user = cachedRankingsCS.find(u => u.username === username);

    if (!user) {
        return res.status(404).json({ error: 'Username not found in leaderboard' });
    }

    const { ranking, score } = user;
    res.json({ username, ranking, score });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});