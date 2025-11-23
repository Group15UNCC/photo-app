/**
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code (see portno below)
 * port. It also establishes a connection to the MongoDB named 'project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch
 * any file accessible to the current user in the current directory or any of
 * its children.
 *
 * This webServer exports the following URLs:
 * /            - Returns a text status message. Good for testing web server
 *                running.
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns the population counts of the cs collections in the
 *                database. Format is a JSON object with properties being the
 *                collection name and the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the
 * database:
 * /user/list         - Returns an array containing all the User objects from
 *                      the database (JSON format).
 * /user/:id          - Returns the User object with the _id of id (JSON
 *                      format).
 * /photosOfUser/:id  - Returns an array with all the photos of the User (id).
 *                      Each photo should have all the Comments on the Photo
 *                      (JSON format).
 */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const async = require("async");

const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const session = require("express-session");
const app = express();

// Middleware for parsing JSON request bodies
app.use(bodyParser.json());

// Configure express-session middleware
app.use(session({
  secret: "secretKey",
  resave: false,
  saveUninitialized: false
}));

// Configure multer for file uploads
const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * Use express to handle argument passing in the URL. This .get will cause
 * express to accept URLs with /test/<something> and return the something in
 * request.params.p1.
 * 
 * If implement the get as follows:
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get("/test/:p1", function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params
  // objects.
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will
    // match it.
    SchemaInfo.find({}, function (error, info) {
      if (error) {
        // Query returned an error. We pass it back to the browser with an
        // Internal Service Error (500) error code.
        console.error("Error in /user/info:", error);
        response.status(500).send(JSON.stringify(error));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object -
        // This is also an internal error return.
        response.status(500).send("Missing SchemaInfo");
        return;
      }

      // We got the object - return it in JSON format.
      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    // In order to return the counts of all the collections we need to do an
    // async call to each collections. That is tricky to do so we use the async
    // package do the work. We put the collections into array and use async.each
    // to do each .count() query.
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (error, count) {
          col.count = count;
          done_callback(error);
        });
      },
      function (error) {
        if (error) {
          response.status(500).send(JSON.stringify(error));
        } else {
          const obj = {};
          for (let i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
          }
          response.end(JSON.stringify(obj));
        }
      }
    );
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400)
    // status.
    response.status(400).send("Bad param " + param);
  }
});

/**
 * Helper function to check if user is logged in
 */
function requireLogin(request, response, next) {
  if (!request.session || !request.session.user_id) {
    return response.status(401).send({ error: "Unauthorized - must be logged in" });
  }
  next();
}

/**
 * URL /admin/login - Login a user
 * POST request with JSON body: { login_name, password }
 */
app.post("/admin/login", async (request, response) => {
  try {
    const loginName = request.body.login_name;
    const password = request.body.password;

    if (!loginName) {
      return response.status(400).send({ error: "login_name is required" });
    }

    if (!password) {
      return response.status(400).send({ error: "password is required" });
    }

    // Find user by login_name
    const user = await User.findOne({ login_name: loginName });
    if (!user) {
      return response.status(400).send({ error: "Invalid login_name or password" });
    }

    // Check password
    if (user.password !== password) {
      return response.status(400).send({ error: "Invalid login_name or password" });
    }

    // Store user info in session
    request.session.user_id = user._id;
    request.session.login_name = user.login_name;

    // Return user information (excluding sensitive data)
    return response.status(200).send({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation
    });
  } catch (error) {
    console.error("Error during login:", error);
    return response.status(400).send({ error: "Login failed" });
  }
});

/**
 * URL /admin/logout - Logout the current user
 * POST request with empty body
 */
app.post("/admin/logout", async (request, response) => {
  try {
    if (!request.session || !request.session.user_id) {
      return response.status(400).send({ error: "User is not logged in" });
    }

    // Destroy session
    request.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return response.status(500).send({ error: "Failed to logout" });
      }
      return response.status(200).send({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return response.status(400).send({ error: "Logout failed" });
  }
});

/**
 * URL /user - Register a new user
 * POST request with JSON body: { login_name, password, first_name, last_name, location, description, occupation }
 */
app.post("/user", async (request, response) => {
  try {
    const { login_name, password, first_name, last_name, location, description, occupation } = request.body;

    // Validate required fields
    if (!login_name || !login_name.trim()) {
      return response.status(400).send({ error: "login_name is required and cannot be empty" });
    }

    if (!password || !password.trim()) {
      return response.status(400).send({ error: "password is required and cannot be empty" });
    }

    if (!first_name || !first_name.trim()) {
      return response.status(400).send({ error: "first_name is required and cannot be empty" });
    }

    if (!last_name || !last_name.trim()) {
      return response.status(400).send({ error: "last_name is required and cannot be empty" });
    }

    // Check if login_name already exists
    const existingUser = await User.findOne({ login_name: login_name.trim() });
    if (existingUser) {
      return response.status(400).send({ error: "login_name already exists" });
    }

    // Create new user
    const newUser = new User({
      login_name: login_name.trim(),
      password: password.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      location: location ? location.trim() : "",
      description: description ? description.trim() : "",
      occupation: occupation ? occupation.trim() : ""
    });

    await newUser.save();

    // Return success (don't return password)
    return response.status(200).send({
      message: "User registered successfully",
      _id: newUser._id,
      first_name: newUser.first_name,
      last_name: newUser.last_name
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return response.status(400).send({ error: "Registration failed" });
  }
});

/**
 * URL /user/list - Returns all the User objects.
 * Protected route - requires login
 */
app.get("/user/list", requireLogin, async (request, response) => {
  try{
    const users = await User.find({}, '_id first_name last_name');
    response.status(200).send(users);
  }
  catch(error){
    console.error("Error fetching user list:", error);
    response.status(500).send({ error: "Database error fetching user list"});
  }
});

/**
 * URL /user/:id - Returns the information for User (id).
 * Protected route - requires login
 */
app.get("/user/:id", requireLogin, async (request, response) => {
  try{
    const user = await User.findById(request.params.id, '_id first_name last_name location description occupation');
    if (!user){
      console.log("User with _id:", request.params.id, "not found.");
      return response.status(400).send({error:"User not found"});
    }
    return response.status(200).send(user);
  } catch (error){
    console.error("Error fetching user:", error);
    return response.status(400).send({ error: "Database error fetching user list"});
  }
  
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 * Protected route - requires login
 */
app.get("/photosOfUser/:id", requireLogin, async (request, response) => {
  try {
    const user = await User.findById(request.params.id);
    if (!user) {
      console.log("User with _id:", request.params.id, "not found.");
      return response.status(400).send({ error: "User not found" });
    }

    const photos = await Photo.find({ user_id: request.params.id })
      .select("-__v")
      .lean();

    await Promise.all(
      photos.map(async (p) => {
        p.comments = await Promise.all(
          p.comments.map(async (c) => {
            const com = await User.findById(c.user_id, "_id first_name last_name");
            return {
              ...c,
              user: com || null,
              user_id: undefined, 
            };
          })
        );
      })
    );

    return response.status(200).send(photos);
  } catch (error) {
    console.error("Error fetching photos for user:", error);
    return response.status(400).send({ error: "Invalid user ID" });
  }
});

/**
 * URL /commentsOfPhoto/:photo_id - Add a comment to the photo.
 * Protected route - requires login
 */
app.post("/commentsOfPhoto/:photo_id", requireLogin, async (request, response) => {
  try {
    const photoId = request.params.photo_id;
    const commentText = request.body.comment;

    // Validate comment is not empty
    if (!commentText || !commentText.trim()) {
      return response.status(400).send({ error: "Comment cannot be empty" });
    }

    // Find the photo
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return response.status(400).send({ error: "Photo not found" });
    }

    // Check if user is logged in
    if (!request.session || !request.session.user_id) {
      return response.status(401).send({ error: "Unauthorized - must be logged in" });
    }
    const userId = request.session.user_id;

    // Create new comment
    const newComment = {
      comment: commentText.trim(),
      date_time: new Date(),
      user_id: userId
    };

    // Add comment to photo's comments array
    photo.comments.push(newComment);
    await photo.save();

    // Return success
    return response.status(200).send({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Error adding comment:", error);
    return response.status(400).send({ error: "Failed to add comment" });
  }
});

/**
 * URL /photos/new - Upload a photo for the current user.
 * Protected route - requires login
 */
app.post("/photos/new", requireLogin, async (request, response) => {
  processFormBody(request, response, async function (err) {
    if (err || !request.file) {
      return response.status(400).send({ error: "No file uploaded or upload error" });
    }

    // Validate file is an image
    if (!request.file.mimetype.startsWith('image/')) {
      return response.status(400).send({ error: "File must be an image" });
    }

    // Check if user is logged in
    if (!request.session || !request.session.user_id) {
      return response.status(401).send({ error: "Unauthorized - must be logged in" });
    }
    const userId = request.session.user_id;

    try {
      // Generate unique filename
      const timestamp = new Date().valueOf();
      const filename = 'U' + String(timestamp) + request.file.originalname;

      // Write file to images directory
      fs.writeFile("./images/" + filename, request.file.buffer, async function (err) {
        if (err) {
          console.error("Error writing file:", err);
          return response.status(500).send({ error: "Failed to save file" });
        }

        // Create Photo object in database
        try {
          const newPhoto = new Photo({
            file_name: filename,
            date_time: new Date(),
            user_id: userId,
            comments: []
          });

          await newPhoto.save();
          return response.status(200).send({ 
            message: "Photo uploaded successfully", 
            photo: newPhoto,
            user_id: userId 
          });
        } catch (dbError) {
          console.error("Error creating photo in database:", dbError);
          // Try to delete the file if database save failed
          fs.unlink("./images/" + filename, () => {});
          return response.status(500).send({ error: "Failed to save photo to database" });
        }
      });
    } catch (error) {
      console.error("Error processing photo upload:", error);
      return response.status(400).send({ error: "Failed to process photo upload" });
    }
  });
});



const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
