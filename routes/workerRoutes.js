const express = require("express");
const {
  applyAsWorker,
  approveWorker,
  rejectWorker,
} = require("../controllers/workerController");

const router = express.Router();

router.post("/apply", applyAsWorker); // Worker applies for approval
router.post("/approve", approveWorker); // Admin approves worker
router.post("/reject", rejectWorker); // Admin rejects a worker

module.exports = router;
