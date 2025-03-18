// Import the required modules
const mongoose = require("mongoose");
const { User } = require("./db.js");

// Connect to your MongoDB database
mongoose.connect("mongodb://localhost/weebsiteDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Function to create the admin user
const createAdminUser = async () => {
  try {
    // Check if the admin user already exists
    const existingAdmin = await User.findOne({ username: "admin" });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }

    // Create a new admin user
    const adminUser = new User({
      username: "admin",
      userID: "1",
      bio: "Admin user",
      password: "admin",
    });

    // Save the admin user to the database
    await adminUser.save();
    console.log("Admin user created successfully.");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
};

// Run the function to create the admin user
createAdminUser();
