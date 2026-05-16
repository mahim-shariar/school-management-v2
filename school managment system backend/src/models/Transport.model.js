const mongoose = require("mongoose");

const routeStopSchema = new mongoose.Schema(
  {
    stopName: { type: String, required: true, trim: true },
    pickupTime: { type: String, trim: true, default: "" },
    dropTime: { type: String, trim: true, default: "" },
    fare: { type: Number, default: 0 },
  },
  { _id: false }
);

const transportRouteSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true, trim: true, maxlength: 100 },
    vehicleNumber: { type: String, trim: true, default: "" },
    driverName: { type: String, trim: true, default: "" },
    driverPhone: { type: String, trim: true, default: "" },
    capacity: { type: Number, default: 0 },
    stops: [routeStopSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const studentTransportSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "TransportRoute", required: true },
    stopName: { type: String, trim: true, default: "" },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const TransportRoute = mongoose.model("TransportRoute", transportRouteSchema);
const StudentTransport = mongoose.model("StudentTransport", studentTransportSchema);

module.exports = { TransportRoute, StudentTransport };
