const http = require('http');
const fs = require('fs');
const { url } = require('inspector');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here

    // delete success message
    let deleteMessage = {"message": "Successfully deleted"}

    // get artists
    if (req.method === 'GET' && req.url === '/artists') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(artists));
      return res.end();
    }

    // get a specific artist by ID
    if (req.method === 'GET' && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');  //  ["", "artists", "1"]
      if (urlParts.length === 3) {
        let requestedId = urlParts[2];
        let requestedArtist = artists[requestedId];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(requestedArtist));
        return res.end();
      }
    }

    // add a new artist
    if (req.method === 'POST' && req.url === '/artists') {
      let latestId = getNewArtistId();
      let latestArtist = {
          "artistId": latestId,
          "name": req.body.name };
      artists[latestId] = latestArtist;
      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(latestArtist));
      return res.end();
    }

    // edit a specific artist by ID
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');  //  ["", "artists", "1"]
      if (urlParts.length === 3) {
        let requestedId = urlParts[2];
        let requestedArtist = artists[requestedId];
        requestedArtist.name = req.body.name;
        requestedArtist.updatedAt = new Date();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(requestedArtist));
        return res.end();
      }
    }

    // delete a specific artist by ID
    if (req.method === 'DELETE' && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        let requestedId = urlParts[2];
        delete artists[requestedId];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(deleteMessage));
        return res.end();
      }
    }

    // function to find albums by artist ID
    let findAlbumsByArtist = (id) => {
      let matchingAlbums = [];
      for (let album in albums) {
        if (albums[album].artistId == id) {
          matchingAlbums.push(albums[album]);
        }
      }
      return matchingAlbums;
    }

    // get all albums of a specific artist by ID
    if (req.method === 'GET' && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === 'albums') {
        let requestedId = urlParts[2];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(findAlbumsByArtist(requestedId)));
        return res.end();
      }
    }

    // function to find album by albumId
    let findAlbumsByAlbumId = (id) => {

      let matchingAlbum = null;
      for (let album in albums) {
        if (albums[album].albumId == id) {
          matchingAlbum = albums[album];
        }
      }
      return matchingAlbum;
    }

    // get a specific album's details by albumId
    if (req.method === 'GET' && req.url.startsWith('/albums/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        let requestedId = urlParts[2];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(findAlbumsByAlbumId(requestedId)));
        return res.end();
      }
    }

    // add an album to an artist by ID
    if (req.method === 'POST' && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === 'albums') {
        let requestedId = urlParts[2];
        let newAlbumId = getNewAlbumId();
        let newAlbum = {
          "albumId": newAlbumId,
          "name": req.body.name,
          "artistId": requestedId
        }
        albums[newAlbumId] = newAlbum;
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(newAlbum));
        return res.end();
      }
    }

    // edit an album by albumId
    if ((req.method === 'PATCH' || req.method === 'PUT') && req.url.startsWith('/albums/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        let requestedId = urlParts[2];
        let requestedAlbum = albums[requestedId];
        requestedAlbum.name = req.body.name;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(requestedAlbum));
        return res.end();
      }
    }

    // delete an album by albumId
    if (req.method === 'DELETE' && req.url.startsWith('/albums/')) {
      let urlParts = req.url.split('/');
        if (urlParts.length === 3) {
          let requestedId = urlParts[2];
          delete albums[requestedId];

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(deleteMessage));
          return res.end();
        }
    }



    // function to find songs by artistId
    let findSongsByArtist = (id) => {
      let matchingSongs = [];

      // find all albums by artist
      let albumsByArtist = findAlbumsByArtist(id);
      albumsByArtist = albumsByArtist.map(
        album => album.albumId
      );
      // iterate through the songs object comparing albumIds
      for (let song in songs) {
        if (albumsByArtist.includes(songs[song].albumId)) {
          matchingSongs.push(songs[song]);
        }
      }
        return matchingSongs;
    }

    // get all songs of a specific artist based on artistId
    if (req.method === 'GET' && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === 'songs') {
        let requestedId = urlParts[2];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(findSongsByArtist(requestedId)));
        return res.end();
      }
    }

    // function to find songs by albumId
    let findSongsByAlbum = (id) => {
      let matchingSongs = [];

      for (let song in songs) {
        if (songs[song].albumId == id) {
          matchingSongs.push(songs[song])
        }
      }
      return matchingSongs;
    }

    // get all songs of a specified album by albumId
    if (req.method === 'GET' && req.url.startsWith('/albums/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === 'songs') {
        let requestedId = urlParts[2];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(findSongsByAlbum(requestedId)));
        return res.end();
      }
    }

    // function to find songs by trackNumber
    let findSongsByTrackNumber = (id) => {
      let matchingSongs = [];
      for (let song in songs) {
        if (songs[song].trackNumber == id) {
          matchingSongs.push(songs[song])
        }
      }
      return matchingSongs;
    }

    // get all songs by trackNumber
    if (req.method === 'GET' && req.url.startsWith('/trackNumbers/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === 'songs') {
        let trackNumber = urlParts[2];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(findSongsByTrackNumber(trackNumber)));
        return res.end();
      }
    }

    // get a songs details by songId
    if (req.method === 'GET' && req.url.startsWith('/songs/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 3)  {
        let requestedId = urlParts[2];

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(songs[requestedId]));
        return res.end();
      }
    }

    /*
    "songId": 1,
    "name": "Dani California",
    "trackNumber": 1,
    "albumId": 1,
    "lyrics":
    */

    // add song to an album by albumId
    if (req.method === 'POST' && req.url.startsWith('/albums/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === 'songs') {
        let requestedId = urlParts[2];
        let newId = getNewSongId();
        let newSong = {
          "songId": newId,
          "name": req.body.name,
          "trackNumber": req.body.trackNumber,
          "albumId": requestedId,
          "lyrics": req.body.lyrics
        }
        songs[newId] = newSong;
        res.statusCode = 201;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(newSong));
        return res.end()
      }
    }

    // edit a song by songId
    if ((req.method === 'PATCH' || req.method === 'PUT') && req.url.startsWith('/songs/')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        let requestedId = urlParts[2];
        songs[requestedId].name = req.body.name;
        songs[requestedId].lyrics = req.body.lyrics;
        songs[requestedId].trackNumber = req.body.trackNumber;
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(songs[requestedId]));
        return res.end()
      }
    }

    // delete song by songId
    if (req.method === 'DELETE' && req.url.startsWith('/songs')) {
      let urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        let requestedId = urlParts[2];
        delete songs[requestedId];
        res.statusCode = 200;
        res.setHeader("Content-Type","application/json");
        res.write(JSON.stringify(deleteMessage));
        return res.end();
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
