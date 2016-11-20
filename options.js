"use strict";

var authType = {
  access_type: "offline",
  scope: "https://www.googleapis.com/auth/musicmanager"
};

var authForm = document.querySelector("#auth");
authForm.action = "#";

var authButton = document.createElement("input");
authButton.type = "button";
authButton.value = `Authorize ${extension.name} with your Google account`;

var authInput = document.createElement("input");
authInput.type = "text";
authInput.placeholder = "Copy the authorization code here";

var authSubmit = document.createElement("input");
authSubmit.type = "submit";

browser.storage.local.get("refresh_token").then(function (tokens) {
  if (tokens.refresh_token) {
    authForm.textContent = `${extension.name} is authorized.`;
    return;
  }
  authForm.innerHTML = "";
  authForm.appendChild(authButton);
}).catch(function (err) {
  authForm.textContent = "Could not check local storage for access tokens."+
                         "See the console for details.";
  console.error(err);
});

authButton.onclick = function (e) {
  window.open(oauth2Client.generateAuthUrl(authType), "auth-window");
  authForm.removeChild(authButton);
  authForm.appendChild(authInput);
  authForm.appendChild(authSubmit);
};

authSubmit.onclick = function () {
  var code = authInput.value;
  oauth2Client.getToken(code, function (err, tokens) {
    if (err) {
      authForm.textContent = "Network error when exchanging authorization code."+
                             "See the console for details.";
      console.error(err);
      return;
    }
    if (tokens.error) {
      authForm.textContent = "Error exchanging authorization code. "+
                             "See the console for details.";
      console.error(tokens);
      return;
    }
    authForm.textContent = `Successfully authorized ${extension.name}.`;
    browser.storage.local.set(tokens);
  });
};
