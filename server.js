// server.js App

// load the things we need
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");

const nodemailer = require("nodemailer"); // Mailing service module to install before importation

//Get students Array object from modules
const studentsObj = require("./modules");

//Express App Instanciation
const app = express();

// set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.static("views"));

app.use(bodyParser.json()); // support json encoded bodies

app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//Settings: file upload && App

//-->upload
const maxSize = 2 * 1024 * 1024;
const imgExtPattern = /\.(jpg|jpeg|png|gif)$/;
const uploadDirectory = __dirname + "/views/assets/images";

//-->App
const port = 8081;

// Creat multer disk storage
const Storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, uploadDirectory);
  },
  filename: function(req, file, callback) {
    const newPictureImgName =
      req.body.firstName + "." + file.originalname.split(".", 2)[1];
    req.body.src = newPictureImgName;
    req.body.alt = req.body.firstName;

    callback(null, newPictureImgName);
  }
});

// Create multer obj for uploading
const upload = multer({
  storage: Storage,
  limits: { fileSize: maxSize },
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(imgExtPattern)) {
      console.log("file:", file.originalname);
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  }
}).single("studentPicture"); //Field name

// index page
app.get("/", (req, res) => {
  res.render("pages/index", { students: studentsObj.students });
});

// about page
app.get("/about", function(req, res) {
  res.render("pages/about");
});

// add page
app.get("/add", (req, res) => {
  res.render("pages/add");
});

// add confirmation page
app.post("/addConfirmation", (req, res) => {
  upload(req, res, function(err) {
    if (err) {

      return res.render("pages/addConfirmation", {
        message: "Error: Student not added and image not uploaded"
      });

    }

      delete req.body.studentPicture;
      req.body.skills = req.body.skills.split(",");
      studentsObj.students.unshift(req.body);           
      return res.render("pages/addConfirmation", {
        message:
          "Success: New Student Added successfully and image uploaded to server..."
      });
  });
});

// details page
app.get("/details/:tabIndex", function(req, res) {
  res.render("pages/details", {
    student: studentsObj.students[req.params.tabIndex]
  });
});

// update page
app.get("/update/:tabIndex", function(req, res) {
  res.render("pages/update", {
    student: studentsObj.students[req.params.tabIndex],
    tabIndex: req.params.tabIndex
  });
});

// update confirmation page
app.post("/updateConfirmation", function(req, res) {
  let message = "";

  const tabIndex = req.body.tabIndex;
  req.body.skills = req.body.skills.split(",");
  delete req.body.tabIndex;

  if (
    tabIndex &&
    tabIndex >= 0 &&
    tabIndex <= studentsObj.students.length - 1
  ) {
    studentsObj.students.splice(Number(tabIndex), 1, req.body);
    message = message + "Success: Student updated successfully";
  }

  console.log(req.body);
  res.render("pages/updateConfirmation", { message });
});

// change picture page
app.get("/changePicture/:tabIndex", (req,res) =>{
  res.render("pages/changePicture");
});

//Change Picture confirmation page
app.post("/changePictureConfirmation", (req,res) =>{
  upload(req, res, function(err) {
    if (err) {

      return res.render("pages/changePictureConfirmation", {
        message: "Error: Image not uploaded.."
      });

    }

             
    return res.render("pages/chnagePictureConfirmation", {
        message:
          "Success: New Image  uploaded successfully to server.."
      });
  });

});



//Delete page
app.get("/delete/:tabIndex", function(req, res) {
  //console.log(typeof req.params.tabIndex);
  let message = "Error: student not deleted";
  const linkToImg =
    __dirname +
    "/views/assets/images/" +
    studentsObj.students[req.params.tabIndex].src;

  if (
    req.params.tabIndex &&
    req.params.tabIndex >= 0 &&
    req.params.tabIndex <= studentsObj.students.length - 1
  ) {
    
    fs.unlink(linkToImg, function(err) {
      //Delete image from images folder
    if (err) res.render("pages/delete", { message: "File deleted!" });
    });
  
    studentsObj.students.splice(Number(req.params.tabIndex), 1);
    res.render("pages/delete", { message: "Success: Student deleted" });
  }

  
});

//Contact page
app.get("/contact", function(req, res) {
  res.render("pages/contact");
});

//Contact confirmation page
app.post("/contactConfirmation", (req, res) => {
  let { firstname, lastname, email, message } = req.body;
  const info = `<h1>Express Node Application</h1>
    <h3>Email sent by mouhssine</h3>
    <p>
    <h3>Form details:</h3>
        firstname: ${firstname}
        <br/> lastname: ${lastname}
        <br/> email: ${email}
        <br/> message: ${message}
        <br/>
        <p>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mouhssineidrissiakhelij1982@gmail.com",
      pass: "xxxxxx"
    }
  });

  var mailOptions = {
    from: "mouhssineidrissiakhelij1982@gmail.com",
    to: "asabeneh@gmail.com, mouhssineidrissiakhelij1982@gmail.com",
    subject: "Sending Email using Node.js and Express",
    html: "<p>" + info + "</p>"
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      res.render("pages/contactConfirmation", {
        message: " Error: email sending fails!"
      });
    } else {
      res.render("pages/contactConfirmation", {
        message: "Success: Email sent successfully."
      });
    }
  });
});

app.listen(port);
console.log(
  "Integrify Photos Gallery App Server is running on the port 8081..."
);
