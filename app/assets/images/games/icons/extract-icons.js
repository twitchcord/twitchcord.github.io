(async function() {
    function slugify(string) {
      const a = 'àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;'
      const b = 'aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------'
      const p = new RegExp(a.split('').join('|'), 'g')

      return string.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word characters
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function saveImage(fileURL, filePath) {
    	await sleep(1000);
		  require('request').get({url: fileURL, encoding: null}, (e,r,b) => fs.writeFileSync(filePath, b));
    }

    var fs = require('fs');
    
    GameStore = tc.webpack.get('games', 'getGame');
    games = {}

    for (let g of GameStore) {
      await saveImage(`https://cdn.discordapp.com/app-icons/${g.id}/${g.icon}.png?size=64`, `D:/Git/Projects/Twitchcord/twitchcord.github.io/app/assets/images/games/icons/64x64/${slugify(g.name)}.png`);
    	await saveImage(`https://cdn.discordapp.com/app-icons/${g.id}/${g.icon}.png?size=32`, `D:/Git/Projects/Twitchcord/twitchcord.github.io/app/assets/images/games/icons/32x32/${slugify(g.name)}.png`);
      await saveImage(`https://cdn.discordapp.com/app-icons/${g.id}/${g.icon}.png?size=20`, `D:/Git/Projects/Twitchcord/twitchcord.github.io/app/assets/images/games/icons/20x20/${slugify(g.name)}.png`);
    }
})();