const express = require("express");
const {
  applyAsWorker,
  uploadWorkerVideo,
} = require("../controllers/workerController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../utils/multer"); // Import Multer middleware

const router = express.Router();

router.post("/apply", upload.single("video"), authMiddleware, applyAsWorker); // Worker applies for approval
router.post(
  "/upload-video",

  upload.single("video"),
  authMiddleware,
  uploadWorkerVideo
); // Worker uploads video

module.exports = router;
