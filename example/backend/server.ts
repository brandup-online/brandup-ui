const cors = require("cors");
const express = require("express");
const path = require("path");
const https = require("https");
const fs = require("fs");

const PORT_ARG_PREFIX = "--port=";
const PORT_DEFAULT = 443;

let port = PORT_DEFAULT;
process.argv.map(value => {
    if (value.indexOf(PORT_ARG_PREFIX) !== 0)
        return;

    port = parseInt(value.substring(PORT_ARG_PREFIX.length)) ?? PORT_DEFAULT;
});
console.log(`run on port ${port}`);

const app = express();

const corsOptions = {
    origin: "*",
};
app.use(cors(corsOptions));


const distDir = path.join(__dirname, "../wwwroot/dist");
app.use(express.static(distDir));

app.get("*", (req, res) => {
    res.sendFile(path.join("index.html"), { root: distDir });
});

const privateKey = fs.readFileSync(path.join(__dirname, "sslcert", "local.decrypted.key"), "utf8");
const certificate = fs.readFileSync(path.join(__dirname, "sslcert", "local.crt"), "utf8");
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
    console.log(`Server start on port ${port}`);
    console.log(`Server start https://localhost:${port}`);
});
