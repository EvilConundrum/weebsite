const http = require("http");

const server = http.createServer((req, res) => {
  console.log("Server is up!");
});

server.listen(3000, "localhost", () => {
  console.log("Server is listening on port 3000");
});
