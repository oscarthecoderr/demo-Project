const { ObjectId } = require("mongodb");

module.exports = function (app, passport, db, multer) {
  // normal routes ===============================================================
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images/uploads");
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + "-" + Date.now() + ".png");
    },
  });
  var upload = multer({ storage: storage });

  app.get("/", function (req, res) {
    res.render("enter.ejs");
  });

  app.get("/didnt-work", function (req, res) {
    res.render("404.ejs");
  });

  app.get("/myEvents", isLoggedIn, function (req, res) {
    db.collection("events")
      .find({ host: req.user.local.email })
      .toArray((err, events) => {
        res.render("myEvents.ejs", {
          user: req.user.local,
          events,
        });
      });
  });

  app.get("/allEvents", isLoggedIn, function (req, res) {
    db.collection("events")
      .find()
      .toArray((err, events) => {
        function isItAPastEvent(eventDate, today) {
          let diff = today.getTime() - eventDate.getTime();
          // If diff is negative, then given date is Future
          return diff > 0;
        }
        let pastEvents = [];
        events.forEach((post) => {
          let today = new Date();
          let date = new Date(post.date);
          
          if (isItAPastEvent(date, today)) {
            pastEvents.push(post);
          }
        });
        events = events.filter(
          (event) => isItAPastEvent(new Date(event.date), new Date()) === false
        );

        res.render("allEvents.ejs", {
          events,
          pastEvents,
        });
      });
  });

  app.get("/settings", isLoggedIn, function (req, res) {
    let color = Math.floor(Math.random() * 16777215).toString(16);

    db.collection("profiles")
      .find({ userId: ObjectId(req.user._id) })
      .toArray((err, signedInUser) => {
        let profile = null;
        let profileId;
        let lastUpdate;

        if (signedInUser[0]) {
          profile = signedInUser[0].settings;
          profileId = signedInUser[0].userId;
          lastUpdate = signedInUser[0].lastUpdate;
        }
        res.render("settings.ejs", {
          user: req.user.local,
          userProfile: profile,
          profileId,
          lastUpdate,
          color: "#" + color,
        });
      });
  });

  app.get("/neighbors", function (req, res) {
    db.collection("users")
      .find()
      .toArray((err, users) => {
        users.forEach((user) => {
          let color = Math.floor(Math.random() * 16777215).toString(16);

          user.color = "#" + color;
        });

        if (err) return console.log(err);
        res.render("neighbors.ejs", {
          users: users,
        });
      });
  });

  app.get("/contact", function (req, res) {
    res.render("contact.ejs");
  });

  // LOGOUT ==============================
  app.get("/logout", function (req, res, next) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  // message board routes ===============================================================

  app.post("/contact", (req, res) => {
    db.collection("contactSubmission").save(
      { name: req.body.name, message: req.body.message, email: req.body.email },
      (err, result) => {
        if (err) return console.log(err);
        res.redirect("/contacts");
      }
    );
  });

  app.post("/updateProfile", isLoggedIn, (req, res) => {
    db.collection("profiles").insertOne(
      { settings: req.body, title: req.user.local.title, userId: req.user._id },
      (err, result) => {
        if (err) return console.log(err);
        res.redirect("/settings");
      }
    );
  });

  app.post("/createEvent", isLoggedIn, (req, res) => {
    let color = Math.floor(Math.random() * 16777215).toString(16);
    db.collection("events").insertOne(
      {
        host: req.body.host,
        title: req.body.eventTitle,
        date: req.body.date,
        age: req.body.ages,
        description: req.body.description,
        location: req.body.location,
        time: req.body.time,
        created: new Date().toLocaleDateString(),
        month: new Date(req.body.date).toLocaleString("en-US", {
          month: "short",
        }),
        backgroundColor: "#" + color,
      },
      (err, result) => {
        if (err) return console.log(err);
        res.redirect("/myEvents");
      }
    );
  });

  app.put("/updateProfile", isLoggedIn, (req, res) => {
    let color = Math.floor(Math.random() * 16777215).toString(16);
    db.collection("profiles").findOneAndUpdate(
      { userId: ObjectId(req.body._id) },
      {
        $set: {
          settings: req.body.settings,
          lastUpdate: req.body.updatedAt,
          iconColor: "#" + color,
        },
      },
      {
        sort: { _id: -1 },
        upsert: true,
      },
      (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      }
    );
  });

  app.delete("/deleteEvent", isLoggedIn, (req, res) => {
    db.collection("events").findOneAndDelete(
      { _id: ObjectId(req.body._id) },
      (err, result) => {
        if (err) return res.send(500, err);
        res.send("Message deleted!");
      }
    );
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/settings", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup-login.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    upload.single("image"),
    passport.authenticate("local-signup", {
      //successRedirect : '/neighbors', // redirect to the secure profile section
      failureRedirect: "/didnt-work", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    }),
    function (req, res) {
      res.redirect("/settings");
    }
  );

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/profile");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}
