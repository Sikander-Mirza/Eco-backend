import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      minlength: [6, "Phone number must be at least 6 characters long"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    mainBalance: {
      type: Number,
      default: 0,
    },

    // ✅ New fields for referral system
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // stores the ID of the referrer user
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // allows null values while keeping uniqueness
      trim: true,
    },
    otpCode: {
  type: String,
  default: null,
},
otpExpires: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
    minimize: false,
  }
);

// ✅ Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Optional: Auto-generate referralCode if not present
UserSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode = `${this.firstName?.toLowerCase() || "user"}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  }
  next();
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
