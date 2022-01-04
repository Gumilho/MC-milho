module.exports = {
  "apps" : [{
    "name"        : "hololive",
    "script"      : "./dist/index.js",
    "watch"       : true,
    "env": {
      "ENV_FILE": "hololive"
    },
  }]
}