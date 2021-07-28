const express = require("express");
const { urlencoded, json } = require("body-parser");
const app = express();
const multer = require("multer");
const fs = require("fs");
const ecstatic = require("ecstatic");
const exec = require("child_process").exec;
const serveIndex = require("serve-index");
const filesize = require("filesize");
const fileUpload = require("express-fileupload");

const { join, resolve } = require("path");

// CommonJS
const edge = require("edge.js").default;
const { unlinkSync } = require("fs");

// Typescript import
// import edge from 'edge.js'
app.use(urlencoded({ extended: false }));

// parse application/json
app.use(json());
app.use(fileUpload());
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
app.get("/upload2", async (req, res) => {
  const html = await edge.render("upload2", {
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
    }
  );

  dir.on("exit", function (code) {
    unlinkSync(resolve("uploads/" + req.file.originalname));
    // exit code is code
    res.redirect("/");
  });
});

app.post("/upload2", function (req, res, next) {
  let video = req.files.video;

  video.mv(resolve("uploads", video.name), function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    dir = exec(
      `MP4Box -splits 102000 "${resolve("uploads/" + video.name)}"`,
      {
        cwd: resolve("uploads"),
      },
      function (err, stdout, stderr) {
        console.log(stdout);
        if (err) {
          console.log(err);
          // should have err.code here?
        }
      }
    );

    dir.on("exit", function (code) {
      unlinkSync(resolve("uploads/" + video.name));
      // exit code is code
      res.redirect("/");
    });
  });
  /*


  
  */
});

module.exports = app;
