fs = require('fs');

GameStore = tc.webpack.get('games', 'getGame');
games = {}

for (let g of GameStore) games[g.name] = g.id;

fs.writeFile('D:/Git/Projects/Twitchcord/twitchcord.github.io/app/assets/images/games',
              JSON.stringify(games, null, 2), () => {
                console.log('FILE SAVED!');
              }
            );