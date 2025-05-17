const User = require('../models/User');
const PhoneNumber = require('../models/PhoneNumber');

// Create a new user (admin only)
const createUser = async (req, res) => {
  try {
    const { userId, name, phoneNumbersAssigned } = req.body;
    
    // Check if user ID already exists
    const userExists = await User.findOne({ userId });
    if (userExists) {
      return res.status(400).json({ message: 'User ID already exists' });
    }

    // Create new user
    const user = await User.create({
      userId,
      name,
      phoneNumbersAssigned: phoneNumbersAssigned || 0
    });

    res.status(201).json({
      userId: user.userId,
      name: user.name,
      phoneNumbersAssigned: user.phoneNumbersAssigned,
      phoneNumbersUsed: user.phoneNumbersUsed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      userId: user.userId,
      name: user.name,
      phoneNumbersAssigned: user.phoneNumbersAssigned,
      phoneNumbersUsed: user.phoneNumbersUsed,
      phoneNumbersRemaining: user.phoneNumbersAssigned - user.phoneNumbersUsed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate phone numbers for user
const generatePhoneNumbers = async (req, res) => {
  try {
    const { count } = req.body;
    const userId = req.user.userId;
    
    // Get user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has enough assigned phone numbers
    const phoneNumbersRemaining = user.phoneNumbersAssigned - user.phoneNumbersUsed;
    if (count > phoneNumbersRemaining) {
      return res.status(400).json({ message: 'Not enough phone numbers allocated to this user' });
    }
    
    // Generate virtual phone numbers from user's quota instead of using real DB entries
    const phoneNumbersToReturn = [];
    
    // Generate random phone numbers based on user's allocation
    for (let i = 0; i < count; i++) {
      // Generate a random 10-digit phone number with prefix
      const areaCode = Math.floor(Math.random() * 900) + 100; // 100-999
      const prefix = Math.floor(Math.random() * 900) + 100; // 100-999
      const lineNumber = Math.floor(Math.random() * 10000); // 0-9999
      const phoneNumber = `+1${areaCode}${prefix}${lineNumber.toString().padStart(4, '0')}`;
      
      phoneNumbersToReturn.push(phoneNumber);
    }
    
    // Update user's used phone numbers count
    user.phoneNumbersUsed += count;
    await user.save();
    
    res.status(200).json({ 
      count: phoneNumbersToReturn.length,
      phoneNumbers: phoneNumbersToReturn
    });
    
  } catch (error) {
    console.error('Error generating phone numbers:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserProfile,
  generatePhoneNumbers
}; 