const express = require("express");
const { urlencoded, json } = require("body-parser");
const app = express();
const multer = require("multer");
const fs = require("fs");
const ecstatic = require("ecstatic");
const exec = require("child_process").exec;
const serveIndex = require("serve-index");
const filesize = require("filesize");

const { join, resolve } = require("path");

// CommonJS
const edge = require("edge.js").default;
const { unlinkSync } = require("fs");

// Typescript import
// import edge from 'edge.js'
app.use(urlencoded({ extended: false }));

// parse application/json
app.use(json());
app.use(express.static("uploads"));
app.use(
  "/static",
  ecstatic({
    root: `${__dirname}/uploads`,
    showdir: true,
  })
);
app.use(
  "/ftp",
  express.static("uploads"),
  serveIndex("uploads", { icons: true, view: "details" })
);

edge.mount(join(__dirname, "views"));

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });

app.get("/", async (req, res) => {
  const html = await edge.render("index", {
    greeting: "Hello world",
  });
  res.send(html);
});
app.get("/list", async (req, res) => {
  const files = fs.readdirSync(resolve("uploads"));
  const archivos = [];
  files.forEach((element) => {
    const ele = fs.statSync(resolve("uploads", element));

    archivos.push({
      date: new Date(ele.birthtime)
        .toISOString()
        .replace(/T/, " ") // replace T with a space
        .replace(/\..+/, ""),
      size: filesize(ele.size),
      name: element,
    });
  });
  const html = await edge.render("list", {
    files: archivos,
  });
  res.send(html);
});

app.post("/upload", upload.single("video"), function (req, res, next) {
  dir = exec(
    `MP4Box -splits 102000 "${resolve("uploads/" + req.file.originalname)}"`,
    {
      cwd: resolve("uploads"),
    },
    function (err, stdout, stderr) {
      console.log(stdout);
      if (err) {
        console.log(err);
        // should have err.code here?
      }
      console.log("finali");
      console.log(stdout);
    }
  );

  dir.on("exit", function (code) {
    unlinkSync(resolve("uploads/" + req.file.originalname));
    // exit code is code
    res.redirect("/");
  });
});

module.exports = app;
