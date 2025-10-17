const path = require("path");

module.exports = {
  entry: { content: "./src/content.js", popup: "./src/popup.js" },

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  mode: "production",
};
