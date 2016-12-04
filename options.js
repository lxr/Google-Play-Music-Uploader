"use strict";

var authType = {
  access_type: "offline",
  scope: "https://www.googleapis.com/auth/musicmanager"
};

var authForm = document.querySelector("#auth");
var codeInput = authForm.querySelector("#code");
var idInput = authForm.querySelector("#id");
var saveButton = authForm.querySelector("button");
var statusText = authForm.querySelector("strong");

// Browsers don't apparently strip leading/trailing tabs or line breaks
// from title fields, so we need to do so ourselves to make the tooltips
// look less funny.
codeInput.title = codeInput.title.replace(/\n\t+/g, "\n").substr(1);
idInput.title = idInput.title.replace(/\n\t+/g, "\n").substr(1);

browser.storage.local.get().then(function (opts) {
  idInput.value = opts.uploader_id;
  if (opts.refresh_token) {
    codeInput.value = `${extension.name} is authorized.`;
    return;
  }
  codeInput.disabled = false;
  codeInput.value = "Click here to begin the authorization process";
  codeInput.onclick = function (e) {
    window.open(oauth2Client.generateAuthUrl(authType), "auth-window");
    codeInput.onclick = null;
    codeInput.type = "text";
    codeInput.value = "Copy the authorization code here..."
  };
}).catch(function (err) {
  codeInput.value = "Error checking local storage for access tokens.";
  statusText.textContent =  "See the console for details.";
  console.error(err);
});

function saveSuccess() {
  statusText.textContent = "Settings saved!";
  saveButton.disabled = false;
  saveButton.value = "Save";
}

function saveError(msg, err) {
  statusText.textContent = msg + " See the console for details.";
  console.error(err);
  saveButton.disabled = false;
  saveButton.value = "Save";
}

saveButton.onclick = function () {
  if (!idInput.value) {
    statusText.textContent = "Device ID cannot be empty.";
    return;
  }
  saveButton.disabled = true;
  saveButton.value = "Saving...";
  if (codeInput.type === "text") {
    var code = codeInput.value;
    oauth2Client.getToken(code, function (err, tokens) {
      if (err) {
        saveError("Network error when exchanging authorization code.", err);
        return;
      }
      if (tokens.error) {
        saveError("Error exchanging authorization code.", tokens);
        return;
      }
      codeInput.value = `Successfully authorized ${extension.name}.`;
      codeInput.disabled = true;
      tokens.uploader_id = idInput.value;
      browser.storage.local.set(tokens)
        .then(saveSuccess)
        .catch(saveError.bind(null, "Error saving settings."));
    });
  } else {
    browser.storage.local.set({ uploader_id: idInput.value })
      .then(saveSuccess)
      .catch(saveError.bind(null, "Error saving settings."));
  }
};
