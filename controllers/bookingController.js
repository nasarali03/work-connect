import Booking from "../models/Booking.js";
import Availability from "../models/Availability.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import Job from "../models/job.js";
import ServiceFee from "../models/ServiceFee.js";

// Set worker availability
export const setAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, breakTimes } = req.body;
    const workerId = req.user.id;

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res
        .status(400)
        .json({ message: "Invalid time format. Use HH:mm" });
    }

    // Check if availability already exists for this day
    let availability = await Availability.findOne({ workerId, dayOfWeek });

    if (availability) {
      // Update existing availability
      availability.startTime = startTime;
      availability.endTime = endTime;
      availability.breakTimes = breakTimes || [];
    } else {
      // Create new availability
      availability = new Availability({
        workerId,
        dayOfWeek,
        startTime,
        endTime,
        breakTimes: breakTimes || [],
      });
    }

    await availability.save();

    res.status(200).json({
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error("Error setting availability:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get worker availability
export const getAvailability = async (req, res) => {
  try {
    const { workerId } = req.params;
    const availability = await Availability.find({ workerId });

    res.status(200).json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a booking
export const createBooking = async (req, res) => {
  try {
    // 1. Get data from request
    const {
      jobId, // ID of the job being booked
      workerId, // ID of the worker being booked
      startTime, // When the job should start
      endTime, // When the job should end
      notes, // Any additional notes
      location, // Where the job will be performed
      price, // Agreed price for the job
    } = req.body;

    const clientId = req.user.id;

    // Validate required fields
    if (!jobId || !workerId || !startTime || !endTime || !location || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if worker is available at the requested time
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const dayOfWeek = startDate.getDay();

    const availability = await Availability.findOne({ workerId, dayOfWeek });
    if (!availability || !availability.isAvailable) {
      return res
        .status(400)
        .json({ message: "Worker is not available at this time" });
    }

    // Check for existing bookings that overlap
    const overlappingBooking = await Booking.findOne({
      workerId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          startTime: { $lt: endDate },
          endTime: { $gt: startDate },
        },
      ],
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: "Time slot is already booked" });
    }

    // Create new booking
    const booking = new Booking({
      jobId,
      workerId,
      clientId,
      startTime: startDate,
      endTime: endDate,
      notes,
      location,
      price,
    });

    await booking.save();

    // Notify worker
    const client = await User.findById(booking.clientId).lean();

    await Notification.create({
      userId: booking.workerId,
      message: `New booking request from ${client.firstName} ${client.lastName}`,
      type: "booking_created",
      jobId: booking.jobId,
      data: {
        booking,
        client: {
          _id: client._id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          profilePicture: client.profilePicture,
          roles: client.roles,
          location: client.location,
          jobsPosted: client.jobsPosted,
          jobsAccepted: client.jobsAccepted,
          jobsCompleted: client.jobsCompleted,
          active: client.active,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          // Add more fields if needed
        },
      },
    });

    res.status(201).json({
      message: "Booking request created successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get worker's bookings
export const getWorkerBookings = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { status, startDate, endDate } = req.query;

    let query = { workerId };
    if (status) query.status = status;
    if (startDate && endDate) {
      query.startTime = { $gte: new Date(startDate) };
      query.endTime = { $lte: new Date(endDate) };
    }

    const bookings = await Booking.find(query)
      .populate("clientId", "firstName lastName")
      .populate("jobId", "title description")
      .sort({ startTime: 1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get client's bookings
export const getClientBookings = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, startDate, endDate } = req.query;

    let query = { clientId };
    if (status) query.status = status;
    if (startDate && endDate) {
      query.startTime = { $gte: new Date(startDate) };
      query.endTime = { $lte: new Date(endDate) };
    }

    const bookings = await Booking.find(query)
      .populate("workerId", "firstName lastName")
      .populate("jobId", "title description")
      .sort({ startTime: 1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId).populate("jobId"); // Populate job details
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify user is either worker or client
    if (
      booking.workerId.toString() !== userId &&
      booking.clientId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Handle booking acceptance
    if (status === "confirmed") {
      // Only worker can confirm the booking
      if (booking.workerId.toString() !== userId) {
        return res.status(403).json({
          message: "Only worker can confirm the booking",
        });
      }

      // Check if booking is in pending state
      if (booking.status !== "pending") {
        return res.status(400).json({
          message: "Can only confirm pending bookings",
        });
      }

      const job = await Job.findById(booking.jobId);
      if (!job) {
        return res.status(404).json({ message: "Associated job not found" });
      }

      // Update booking status
      booking.status = "confirmed";
      await booking.save();

      // Update job status
      job.status = "in progress";
      job.workerId = userId; // Assign worker to the job
      await job.save();

      // Increment worker's accepted jobs count
      await User.findByIdAndUpdate(userId, {
        $inc: { jobsAccepted: 1 },
      });

      // Notify client
      const worker = await User.findById(booking.workerId).lean();

      await Notification.create({
        userId: booking.clientId,
        message: `Worker ${worker.firstName} ${worker.lastName} has accepted your booking request`,
        type: "booking_confirmed",
        jobId: booking.jobId,
        data: {
          booking,
          worker: {
            _id: worker._id,
            firstName: worker.firstName,
            lastName: worker.lastName,
            email: worker.email,
            phoneNumber: worker.phoneNumber,
            profilePicture: worker.profilePicture,
            roles: worker.roles,
            location: worker.location,
            jobsPosted: worker.jobsPosted,
            jobsAccepted: worker.jobsAccepted,
            jobsCompleted: worker.jobsCompleted,
            active: worker.active,
            createdAt: worker.createdAt,
            updatedAt: worker.updatedAt,
            workerDetails: worker.workerDetails,
            // Add more fields if needed
          },
        },
      });

      return res.status(200).json({
        message: "Booking confirmed and job assigned to worker",
        booking,
        job,
      });
    }

    // Handle booking completion
    if (status === "completed") {
      const job = await Job.findById(booking.jobId);
      if (!job) {
        return res.status(404).json({ message: "Associated job not found" });
      }

      // Worker requests completion
      if (booking.workerId.toString() === userId) {
        if (job.status !== "in progress") {
          return res.status(400).json({
            message: "Job must be in progress before requesting completion",
          });
        }

        // Update booking status
        booking.status = "awaiting_confirmation";
        await booking.save();

        // Update job status
        job.status = "awaiting confirmation";
        job.paymentStatus = "in progress";
        await job.save();

        // Notify client
        await Notification.create({
          userId: booking.clientId,
          message: `Worker has requested to complete the booking`,
          type: "booking_completion_request",
          jobId: job._id,
          data: { bookingId: booking._id },
        });

        return res.status(200).json({
          message: "Booking completion requested. Waiting for client approval.",
          booking,
          job,
        });
      }

      // Client confirms completion
      if (booking.clientId.toString() === userId) {
        if (job.status !== "awaiting confirmation") {
          return res.status(400).json({
            message: "Booking completion request not yet made by worker.",
          });
        }

        // Update booking status
        booking.status = "completed";
        await booking.save();

        // Update job status
        job.status = "completed";
        job.paymentStatus = "completed";
        job.clientVerification = true;
        job.workerVerification = true;
        await job.save();

        // Increment worker's completed jobs count
        await User.findByIdAndUpdate(booking.workerId, {
          $inc: { jobsCompleted: 1 },
        });

        // Notify worker
        await Notification.create({
          userId: booking.workerId,
          message: `Client has confirmed the booking completion`,
          type: "booking_completed",
          jobId: job._id,
          data: { bookingId: booking._id },
        });

        return res.status(200).json({
          message: "Booking and job marked as completed",
          booking,
          job,
        });
      }
    }

    // Handle booking rejection
    if (status === "rejected") {
      // Only worker can reject
      if (booking.workerId.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "Only worker can reject the booking" });
      }

      booking.status = "rejected";
      await booking.save();

      const worker = await User.findById(booking.workerId).lean();

      await Notification.create({
        userId: booking.clientId,
        message: `Worker ${worker.firstName} ${worker.lastName} has rejected your booking request`,
        type: "booking_rejected",
        jobId: booking.jobId,
        data: {
          booking,
          worker: {
            _id: worker._id,
            firstName: worker.firstName,
            lastName: worker.lastName,
            email: worker.email,
            phoneNumber: worker.phoneNumber,
            profilePicture: worker.profilePicture,
            roles: worker.roles,
            location: worker.location,
            jobsPosted: worker.jobsPosted,
            jobsAccepted: worker.jobsAccepted,
            jobsCompleted: worker.jobsCompleted,
            active: worker.active,
            createdAt: worker.createdAt,
            updatedAt: worker.updatedAt,
            workerDetails: worker.workerDetails,
            // Add more fields if needed
          },
          reason: req.body.reason || "No reason provided",
        },
      });

      return res.status(200).json({
        message: "Booking rejected and client notified",
        booking,
      });
    }

    // For other status updates (cancelled)
    booking.status = status;
    await booking.save();

    // Notify the other party
    const notifyUserId =
      booking.workerId.toString() === userId
        ? booking.clientId
        : booking.workerId;
    await Notification.create({
      userId: notifyUserId,
      message: `Booking status updated to ${status}`,
      type: "booking_status",
      jobId: booking.jobId,
      data: { bookingId: booking._id },
    });

    res.status(200).json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markBookingAsPaid = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Booking is not completed yet" });
    }

    // Find the associated job
    const job = await Job.findById(booking.jobId);
    if (!job) {
      return res.status(404).json({ message: "Associated job not found" });
    }
    if (job.isPaid) {
      return res.status(400).json({ message: "Job is already marked as paid" });
    }

    // Find the service fee record
    const serviceFee = await ServiceFee.findOne({ jobId: job._id });
    if (!serviceFee) {
      return res.status(404).json({ message: "Service fee record not found" });
    }

    // Calculate company fee and amount paid to worker
    const companyFee = serviceFee.serviceFeeAmount;
    const amountPaid = serviceFee.jobAmount - companyFee;

    // Update job
    job.isPaid = true;
    job.paidAt = new Date();
    job.companyFee = companyFee;
    job.amountPaid = amountPaid;
    await job.save();

    // Update service fee status
    serviceFee.status = "paid";
    serviceFee.paymentDate = new Date();
    await serviceFee.save();

    res.status(200).json({
      message: "Booking and job marked as paid",
      booking,
      job,
      serviceFee,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
