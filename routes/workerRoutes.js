const express = require("express");
const {
  applyAsWorker,
  uploadWorkerVideo,
} = require("../controllers/workerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/apply", authMiddleware, applyAsWorker); // Worker applies for approval
router.post(
  "/upload-video",

  authMiddleware,
  uploadWorkerVideo
); // Worker uploads video

module.exports = router;
