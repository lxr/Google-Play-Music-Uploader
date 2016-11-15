// Copyright (c) 2014 Lari Rasku <lari.o.rasku@gmail.com>
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

GOAuth2 = {};

GOAuth2.authorize = function (params, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', GOAuth2.getAuthUrl(params), true);
  xhr.onerror = callback;
  xhr.onload = function (response) {
    if (this.status != 200) {
      return callback(this);
    }
    response = GOAuth2.urldecode(this.responseURL.split('#')[1] || '');
    if (!('access_token' in response)) {
      callback('no access token in fragment');
    } else {
      GOAuth2.validate(params, response, callback);
    }
  };
  xhr.send();
}

GOAuth2.validate = function (credentials, tokenObj, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://www.googleapis.com/oauth2/v1/tokeninfo?' +
                  GOAuth2.urlencode(tokenObj), true);
  xhr.onerror = callback;
  xhr.onload = function (response) {
    if (this.status != 200) {
      return callback(this);
    }
    try {
      response = JSON.parse(response.responseText);
    } catch (e) {
      return callback(e);
    }
    if (response.scope === credentials.scope
    && response.audience.split('.')[0] == credentials.client_id) {
      callback(null, tokenObj);
    } else {
      callback(response);
    }
  };
  xhr.send();
}

GOAuth2.getAuthUrl = function (params) {
  params.response_type = 'token';
  return 'https://accounts.google.com/o/oauth2/auth?' +
         GOAuth2.urlencode(params);
}

GOAuth2.urlencode = function (obj) {
  var pairs = [];
  for (var key in obj) {
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
  }
  return pairs.join('&');
}

GOAuth2.urldecode = function (str) {
  var obj = {};
  var pairs = str.split('&');
  for (var i = 0, pair; pair = pairs[i]; ++i) {
    pair = pair.split('=');
    obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return obj;
}
