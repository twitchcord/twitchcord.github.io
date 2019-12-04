const fs = require('fs')
const path = require('path')
const request = require('request')
const util = require('util')
const clientID = 'ow3c01cbrcjucmtt3idudkzv1zs4fm'
const LOCAL_FILE = 'all.json'
const LOCAL_PATH = 'boxarts/'
const TWITCH_API_DELAY = 2000
const BOXART_DELAY = 100

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

// Async version of http request
async function request_page(url) {
  var promise = new Promise( (resolve, reject) => {
    var options = {
      url: url,
      headers: {
        'Client-ID': clientID
      }
    }
    console.error("Requesting page", url)
    request(options, function (error, response, body) {
      if (error) {
        console.error("Request Error:", error)
        reject(error)
      } else {
        resolve({
          response: response,
          body: body
        })   
      }
    })
  })

  return promise
}

// Async version of http request for binary data
async function request_image(url) {
  var promise = new Promise( (resolve, reject) => {
    var options = {
      url: url,
      encoding: null
    }
    console.error("    requesting image", url)
    request(options, function (error, response, body) {
      if (error) {
        console.error("Request Error:", error)
        reject(error)
      } else {
        resolve({
          response: response,
          body: body
        })   
      }
    })
  })

  return promise
}

// Async version of sleep
async function mysleep(msec) {
  var promise = new Promise( (resolve, reject) => {
    setTimeout(() => {
      resolve(msec)
    }, msec)
  })
  return promise
}

// Local path for each box art
function get_local_path(url) {
  var ext = path.extname(url)
  url = url.replace(/285x380/, '')
  return path.resolve(LOCAL_PATH, slugify(decodeURIComponent(path.basename(url, ext)))) + ext
}

// Download one boxart entry
async function download_entry(entry) {
  entry.box_art_url = entry.box_art_url.replace(/{width}x{height}/, '285x380')

  try {
    // Request the box art url
    var {body, response} = await request_image(entry.box_art_url)
  
    // Check if the response got redirected to the 404 page
    var is404 = response?response.headers['x-404-redirect']:false
    if (is404) {
      entry.error = "404"
      console.error("404 error", entry.box_art_url)
    } else {
      // Write data to file
      entry.local_path = get_local_path(entry.box_art_url)
      fs.writeFileSync(entry.local_path, body)
    }
  } catch(error) {
    // Capture any errors
    entry.error = "error: " + error
    console.error("error", error)
  }

  //console.error("Done")
  return entry
}

// Load one chunk from twitch API and download all boxarts for that chunk
async function get_chunk(cursor) {
    // Format the API URL
    var url = 'https://api.twitch.tv/helix/games/top?first=100'
    if (cursor && cursor != 'BEGIN') {
      url = url + '&after=' + cursor
    }

    // Make the request for the page
    var {body, response} = await request_page(url)
    var page = JSON.parse(body)
    console.error(page.data.length)

    // Obtain next cursor
    var next_cursor = page.pagination.cursor

    // Download all the box art images
    var returns = []
    for (var i=0; i < page.data.length; i++) {
      var e = page.data[i]
      var entry = await download_entry(e)
      returns.push(entry)
      await mysleep(BOXART_DELAY)
    }

    return({cursor: next_cursor, data: returns})
}

// Sometimes we need to retry if network errors happen
async function get_chunk_with_retry(cursor) {
  var retry = true
  while (retry) {
    try {
      page = await get_chunk(cursor)
      retry = false
    } catch(e) {
      console.error("Retrying page ...", cursor)
      await mysleep(TWITCH_API_DELAY)
    }
  }
  return page
}

async function process_page() {
  var final_data = []

  // Process each page, using the cursor
  var cursor = 'BEGIN'
  while (cursor) {
    var page = await get_chunk_with_retry(cursor)

    // Accumulate results
    if (page.data) {
      final_data = final_data.concat(page.data)
    }

    cursor = page.cursor

    await mysleep(TWITCH_API_DELAY)
  }

  // For debugging
  debug_print(final_data)
  return(final_data)
}

function debug_print(final_data) {
  var output = '['
  for (var i=0; i<final_data.length; i++) {
    output = output + (i>0?",\n":"\n") + JSON.stringify(final_data[i])
  }
  console.log(output)
}

process_page().then(() => {
  console.error("Success")
}).finally(() => {
  console.error("Finished")
})

