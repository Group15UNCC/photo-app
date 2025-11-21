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
const session = require('express-session');
const app = express();

const multer = require("multer");
const fs = require("fs");
const processFormBody = multer({ storage: multer.memoryStorage() }).single('uploadedphoto');



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
app.use(express.json());
app.use('/images', express.static(__dirname + '/images'));

//Session configuration
app.use(session({
    secret: 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

app.use(express.json());

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

// Middleware to check if user is logged in
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    next();
}

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
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", requireAuth, async (request, response) => {
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
 */
app.get("/user/:id", requireAuth, async (request, response) => {
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
 * URL /admin/login - Logs in a user by setting session user_id
 */

// Login endpoint
app.post('/admin/login', requireAuth, async (req, res) => {
    const { login_name } = req.body;
    
    if (!login_name) {
        return res.status(400).send('Login name is required');
    }
    
    try {
        const user = await User.findOne({ login_name: login_name });
        
        if (!user) {
            return res.status(400).send('Invalid login name');
        }
        
        // Store user info in session
        req.session.user = {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            login_name: user.login_name
        };
        
        // Return user info
        res.status(200).json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            login_name: user.login_name
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Internal server error');
    }
});

// Logout endpoint
app.post('/admin/logout', requireAuth, (req, res) => {
    if (!req.session.user) {
        return res.status(400).send('No user is currently logged in');
    }
    
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.status(200).send('Logout successful');
    });
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", requireAuth, async (request, response) => {
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

app.post("/commentsOfPhoto/:photo_id", requireAuth, async (request, response) => {
  const photoId = request.params.photo_id;
  const commentText =
    request.body && typeof request.body.comment === "string"
      ? request.body.comment.trim()
      : "";

  if (!commentText) {
    response.status(400).send({ error: "Comment text must not be empty." });
    return;
  }

  const sessionUserId =
    request.session &&
    (request.session.user_id ||
      (request.session.user && request.session.user._id));
  const requestUserId =
    request.body && typeof request.body.user_id === "string"
      ? request.body.user_id
      : null;
  const userId = sessionUserId || requestUserId;

  if (!userId) {
    response.status(401).send({ error: "User must be logged in to comment." });
    return;
  }

  try {
    const [photo, user] = await Promise.all([
      Photo.findById(photoId),
      User.findById(userId, "_id first_name last_name"),
    ]);

    if (!photo) {
      response.status(400).send({ error: "Photo not found." });
      return;
    }

    if (!user) {
      response.status(400).send({ error: "User not found." });
      return;
    }

    const newComment = {
      comment: commentText,
      date_time: new Date(),
      user_id: user._id,
    };

    photo.comments.push(newComment);
    await photo.save();

    const savedComment = photo.comments[photo.comments.length - 1];

    response.status(200).send({
      _id: savedComment._id,
      comment: savedComment.comment,
      date_time: savedComment.date_time,
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    console.error("Error adding comment to photo:", error);
    response.status(500).send({ error: "Failed to add comment to photo." });
  }
});

app.post("/photos/new", (request, response) => {
    processFormBody(request, response, async function (err) {
        if (err || !request.file) {
            console.error("Error processing file:", err);
            return response.status(400).send({ error: "No file uploaded or upload failed." });
        }

        try {
            // Generate unique filename
            const timestamp = new Date().valueOf();
            const filename = "U" + String(timestamp) + request.file.originalname;

            // Save file to images folder
            fs.writeFileSync("./images/" + filename, request.file.buffer);

            // Assign a user_id for now (since login isn’t implemented)
            const defaultUser = await User.findOne(); // pick first user in DB
            if (!defaultUser) {
                return response.status(400).send({ error: "No users in database to assign photo to." });
            }

            // Create Photo object in MongoDB
            const newPhoto = new Photo({
                file_name: filename,
                date_time: new Date(),
                user_id: defaultUser._id,
                comments: [],
            });

            await newPhoto.save();
            console.log("Photo uploaded successfully:", filename);
            response.status(200).send(newPhoto);

        } catch (error) {
            console.error("Error saving photo:", error);
            response.status(500).send({ error: "Failed to save photo" });
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