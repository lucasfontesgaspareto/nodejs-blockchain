const fetch = require('node-fetch')

fetch("http://localhost:4000/api/blocks", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,pt;q=0.8",
    "if-none-match": "W/\"288-moI9flzCbH+p6vIbQfzxUphdM3c\"",
    "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referer": "http://localhost:4000/api/blocks",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
}).then(response => response.json()).then(console.log).catch(console.log)