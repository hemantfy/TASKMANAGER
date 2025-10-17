const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { formatUserRole, normalizeRole } = require("../utils/roleUtils");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const buildUserPayload = (user, { includeToken = false } = {}) => {
  const formattedUser = formatUserRole(user);

  if (!formattedUser) {
    return formattedUser;
  }

  const payload = {
    _id: formattedUser._id,
    name: formattedUser.name,
    email: formattedUser.email,
    role: formattedUser.role,
    profileImageUrl: formattedUser.profileImageUrl,
    birthdate: formattedUser.birthdate,
    gender: formattedUser.gender,
    officeLocation:
      typeof formattedUser.officeLocation === "string"
        ? formattedUser.officeLocation.trim()
        : formattedUser.officeLocation,
    mustChangePassword: formattedUser.mustChangePassword,
  };

  if (includeToken) {
    payload.token = generateToken(formattedUser._id);
  }

  return payload;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      profileImageUrl,
      adminInviteToken,
      privilegedRole,
      birthdate,
      gender,
      officeLocation,
    } = req.body;

    const trimmedOfficeLocation =
      typeof officeLocation === "string" ? officeLocation.trim() : "";

    // Check if User already exist
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (!gender || !trimmedOfficeLocation) {
      return res
        .status(400)
        .json({ message: "Gender and office location are required" });
    }

    const trimmedAdminInviteToken =
      typeof adminInviteToken === "string" ? adminInviteToken.trim() : "";
    const normalizedPrivilegedRole = normalizeRole(privilegedRole) || "";

    // Determine user role based on provided token/selection
    let role = "member";

    if (trimmedAdminInviteToken) {
      if (trimmedAdminInviteToken !== process.env.ADMIN_INVITE_TOKEN) {
        return res.status(403).json({ message: "Invalid admin invite token" });
      }

      const allowedPrivilegedRoles = ["admin", "owner"];
      role = allowedPrivilegedRoles.includes(normalizedPrivilegedRole)
        ? normalizedPrivilegedRole
        : "admin";
    } else if (normalizedPrivilegedRole && normalizedPrivilegedRole !== "member") {
      return res.status(400).json({
        message: "Admin invite token is required to register as an admin or owner",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const parsedBirthdate = birthdate ? new Date(birthdate) : null;

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImageUrl,
      role,
      birthdate: parsedBirthdate && !isNaN(parsedBirthdate) ? parsedBirthdate : null,
      gender,
      officeLocation: trimmedOfficeLocation,
      mustChangePassword: false,
    });

    // Return user data with JWT
    res.status(201).json(buildUserPayload(user, { includeToken: true }));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Return user data with JWT
    res.json(buildUserPayload(user, { includeToken: true }));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (Requires JWT)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(buildUserPayload(user));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private (Requires JWT)
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (Object.prototype.hasOwnProperty.call(req.body, "gender")) {
      user.gender = req.body.gender;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "officeLocation")) {
      const incomingOfficeLocation = req.body.officeLocation;

      if (typeof incomingOfficeLocation === "string") {
        const trimmedLocation = incomingOfficeLocation.trim();

        if (trimmedLocation) {
          user.officeLocation = trimmedLocation;
        }
      } else if (incomingOfficeLocation) {
        user.officeLocation = incomingOfficeLocation;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "birthdate")) {
      const providedBirthdate = req.body.birthdate;

      if (!providedBirthdate) {
        user.birthdate = null;
      } else {
        const parsedBirthdate = new Date(providedBirthdate);
        if (!isNaN(parsedBirthdate)) {
          user.birthdate = parsedBirthdate;
        }
      }
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      message: "Profile updated successfully",
      ...buildUserPayload(updatedUser, { includeToken: true }),
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };