var Promise = require("Promise");

/**
  * FetchModel - Fetch a model from the web server.
  *     url - string - The URL to issue the GET request.
  * Returns: a Promise that should be filled
  * with the response of the GET request parsed
  * as a JSON object and returned in the property
  * named "data" of an object.
  * If the requests has an error the promise should be
  * rejected with an object contain the properties:
  *    status:  The HTTP response status
  *    statusText:  The statusText from the xhr request
  *
*/

function fetchModel(url) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('GET', url, true);

    x.onload = () => {
      if (x.status >= 200 && x.status < 300) {
        try {
          const data = JSON.parse(x.responseText);
          resolve({ data });
        } catch (err) {
          reject({ status: x.status, statusText: 'Invalid JSON' });
        }
      } else {
        reject({ status: x.status, statusText: x.statusText });
      }
    };

    x.onerror = () => {
      reject({ status: x.status, statusText: x.statusText });
    };

    x.send();
  });
}
export default fetchModel;
