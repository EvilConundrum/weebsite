const http = require("http");

const server = http.createServer((req, res) => {
  console.log("Server is up!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
