const express = require("express");
const multer = require("multer");
const route = express.Router();
//place where files will be uploaded

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); //callback to tell where we want to store file
    //null part is err part
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage: storage });
const authMiddleware = require("../auth/auth");
const chatController = require("../controllers/chat");

//storing chats into DB
route.post("/post-chat", authMiddleware.authenticate, chatController.postChat);

//getting chats from DB
route.get("/get-chats", authMiddleware.authenticate, chatController.getChats);

//posting files thorugh multer
route.post(
  "/upload",
  authMiddleware.authenticate,
  upload.single("image"),
  chatController.uploadFile
);

module.exports = route;
