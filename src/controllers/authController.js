const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/authService');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { user, token, refreshToken } = await authService.register(req.body);

  res.status(201).json(
    new ApiResponse(201, { user, token, refreshToken }, 'User registered successfully')
  );
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token, refreshToken } = await authService.login(email, password);

  res.status(200).json(
    new ApiResponse(200, { user, token, refreshToken }, 'Login successful')
  );
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(200).json(
    new ApiResponse(200, { user }, 'Profile fetched successfully')
  );
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);

  res.status(200).json(
    new ApiResponse(200, { user }, 'Profile updated successfully')
  );
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

  res.status(200).json(
    new ApiResponse(200, result, 'Password changed successfully')
  );
});
