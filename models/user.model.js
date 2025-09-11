import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const emailRegex = /^\S+@\S+\.\S+$/;

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, trim: true, lowercase: true, unique: true, match: [emailRegex, "Invalid email"] },
    password: { type: String, required: true, minlength: 6 },
    bio:      { type: String, default: "" },
    active:   { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

// Hash de contraseña si cambió
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
