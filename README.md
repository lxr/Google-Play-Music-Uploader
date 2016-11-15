# Introduction

Google Play Music Uploader is a WebExtension that replaces the [Upload
music] [1] page on Google Play Music with an embedded upload form.  This
lets one upload music without installing either Google Chrome or the
Google Music Manager.

Note that use of this extension likely constitutes a violation of
[Google's Terms of Service] [2], as it employs an [unofficial interface]
[3] to Google services.

# Installation

Google Play Music Uploader does not come packaged for any browser.
Clone the repository to your computer and use your browser's load
unpacked extension feature, or package it yourself.

You must authorize Google Play Music Uploader with your Google
account in order to use it.  The extension will prompt you to do this
when you first navigate to the upload page.

# Bugs

Google Play Music Uploader uses [google.musicmanager.js] [3] behind the
scenes, and inherits its limitations: no song matching, album art isn't
automatically uploaded, only MP3 files are supported, and files that
contain huge metadata or encoding errors may cause the upload to
silently hang.  Try re-encoding and/or stripping the metadata of files
that fail to upload.

Parsing MP3 files in client-side JavaScript is also very
processor-intensive work.  Your browser may go unresponsive for a few
seconds when you start uploading.

[1]: https://play.google.com/music/listen#/manager
[2]: https://www.google.com/intl/en/policies/terms/
[3]: https://github.com/lxr/google.musicmanager.js
