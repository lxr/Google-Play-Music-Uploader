// Copyright (c) 2014-6 Lari Rasku <lari.o.rasku@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

"use strict";

/* OAuth 2.0 authentication */

var client = null;

browser.storage.local.get().then(function (arr) {
  var opts = arr[0];
  if (!opts.access_token || !opts.refresh_token || !opts.uploader_id)
    return;
  oauth2Client.setCredentials(opts);
  client = new google.musicmanager.Client(opts.uploader_id, opts.access_token);
}).catch(console.error);

/* DOM manipulation */

new MutationObserver(function () {
  var view = document.querySelector(".upload-music-view");
  if (!view) return;
  view.className = "g-content view-transition";
  view.innerHTML = "";
  view.appendChild(client ? uploadDialog : errorMessage);
}).observe(document.querySelector("#music-content"), { childList: true });

var uploadDialog = JXON.unbuild({
  "@id": "uploadDialog",

  "h2": {
    "@class": "section-header",
    "keyValue": "Drag songs below to start uploading."
  },

  "div": {
    "@class": "songlist-container material-shadow-z1",
    "@ondragover": "return false",
    "@ondragleave": "return false",

    "table": {
      "@class": "song-table",

      "thead": { "tr": {
        "@class": "header-row",

        "th": [
          { "@data-col": "title",        "keyValue": "Name" },
          { "@data-col": "duration",     "@title":   "Duration",
            "iron-icon": { "@class": "x-scope iron-icon-1", "@icon": "device:access-time", "@alt": "Duration" } },
          { "@data-col": "artist",       "keyValue": "Artist" },
          { "@data-col": "album",        "keyValue": "Album" },
          { "@data-col": "date-deleted", "keyValue": "Status" },
        ]
      } },

      "tbody": {}
    }
  }
}, "http://www.w3.org/1999/xhtml", "div").documentElement;
uploadDialog.querySelector("div").ondrop = uploadFiles;

var errorMessage = JXON.unbuild({
  "@class": "settings-card material-shadow-z1",
  "keyValue": `You don't appear to have authorized ${extension.name} `+
              "with your Google Account or given it a device ID. "+
              "Please go to the options page to do so."
}, "http://www.w3.org/1999/xhtml", "div").documentElement;

/* script body */

function uploadFiles(e) {
  var fileList =
    Array.prototype.slice.call(e.target.files || e.dataTransfer.files);
  var upload = client.upload(fileList);
  var tbody = document.querySelector("#uploadDialog tbody");

  e.stopPropagation();
  e.preventDefault();

  fileList.forEach(function (file) {
    var tr = JXON.unbuild({
      "@class": "song-row",

      "td": [
        { "@data-col": "title", "span": { "@class": "column-content", "keyValue": file.name } },
        { "@data-col": "duration", "span": { "keyValue": formatSize(file.size) } },
        { "@data-col": "artist", "span": { "@class": "column-content" } },
        { "@data-col": "album", "span": { "@class": "column-content" } },
        { "@data-col": "date-deleted" }
      ]
    }, "http://www.w3.org/1999/xhtml", "tr").documentElement;
    tbody.insertBefore(tr, tbody.firstChild);
    file.row = {
      title:    tr.querySelector("[data-col=title] > .column-content"),
      duration: tr.querySelector("[data-col=duration] > span"),
      artist:   tr.querySelector("[data-col=artist] > .column-content"),
      album:    tr.querySelector("[data-col=album] > .column-content"),
      status:   tr.querySelector("[data-col=date-deleted]"),
    };
  });

  upload.on("error", errorHandler);

  upload.on("metadata-start", function (file) {
    file.row.status.textContent = "reading metadata...";
  });

  upload.on("metadata-end", function (file, metadata, image) {
    var row = file.row;
    var img = document.createElement("img");
    img.src = "https://play.google.com/music/default_album.svg";
    console.log(metadata);
    if (metadata.title) {
      row.title.textContent = metadata.title;
    }
    if (metadata.duration_millis) {
      row.duration.textContent = formatTime(metadata.duration_millis);
    }
    if (image) {
      img.src = URL.createObjectURL(new Blob([image]));
    }
    row.title.insertBefore(img, row.title.firstChild);
    row.artist.textContent = metadata.artist;
    row.album.textContent = metadata.album;
    row.status.textContent = "metadata read";
  });

  upload.on("metadata-upload", function () {
    fileList.forEach(function (file) {
      file.row.status.textContent = "uploading metadata...";
    });
  });

  upload.on("status", function (file, status) {
    file.row.status.textContent = status.toLowerCase().replace("_", " ");
  });

  upload.on("upload-start", function (file) {
    file.row.status.textContent = "starting upload...";
  });

  upload.on("progress", function (file, ev) {
    file.row.status.textContent = Math.floor(100 * ev.loaded/ev.total) + "%";
  });

  upload.on("upload-end", function (file) {
    file.row.status.textContent = "uploaded";
  });

  upload.start();
}

function errorHandler(err, resume) {
  if (err.statusText === "Unauthorized" || err.auth_status === 16) {
    oauth2Client.refreshAccessToken((function (err, tokens) {
      if (err) {
        console.error(err);
      } else {
        this.token = client.token = tokens.access_token;
        browser.storage.local.set(tokens);
        resume();
      }
    }).bind(this));
  } else if (err.statusText === "Forbidden") {
    var register = client.register(extension.name);
    register.on("error", console.error);
    register.on("end", resume);
    register.start();
  } else if (err.errorCode === 503 || err.auth_status === 13) {
    resume();
  } else {
    console.error(err);
  }
}

/* helper functions */

function formatSize(bytes) {
  return (bytes / (1<<20)).toFixed(1) + "\u00A0MB";
}

function formatTime(millis) {
  var seconds = Math.ceil(millis / 1000);
  var minutes = Math.floor(seconds / 60);
  var hours = Math.floor(minutes / 60);
  seconds -= minutes * 60;
  minutes -= hours * 60;
  seconds = (seconds < 10 ? "0" : "") + seconds;
  minutes = (hours > 0 && minutes < 10 ? "0" : "") + minutes;
  return (hours > 0 ? hours + ":" : "") + minutes + ":" + seconds;
}
