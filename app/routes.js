
var mongoose = require('mongoose');
const ObjectId = require("mongodb").ObjectId;
module.exports = function (app, passport, db, multer, ObjectId) {
  // Image Upload Code =========================================================================
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images/uploads");
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + "-" + Date.now() + ".png");
    },
  });
  var upload = multer({ storage: storage });

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get("/", function (req, res) {
    res.render("index.ejs");
  });

  // PROFILE SECTION =========================
  app.get("/profile", isLoggedIn, function (req, res) {
    let user = req.user;
    db.collection("posts")
      .find({ postedBy : user.local.username })
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("profile.ejs", {
          user: req.user,
          posts: result,
        });
      });
  });

  // app.get("/profile", isLoggedIn, function (req, res) {
  //   let postId = ObjectId(req.params.id);
  //   console.log("postId");
  //   db.collection("posts")
  //     .find({ postedBy: postId })
  //     .toArray((err, result) => {
  //       if (err) return console.log(err);
  //       res.render("profile.ejs", {
  //         user: req.user,
  //         posts: result,
  //       });
  //     });
  // });

  //feed page
  app.get("/feed", function (req, res) {
    db.collection("posts")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("feed.ejs", {
          posts: result,
        });
      });
  });

  app.get("/post/comments/:zebra", isLoggedIn, function (req, res) {
    let postId = ObjectId(req.params.zebra);
    console.log(postId);
    db.collection("posts")
      .find({ _id: postId })
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("post.ejs", {
          posts: result,
        });
      });
  });

  //profile page
  app.get("/page/:id", isLoggedIn, function (req, res) {
    let postId = ObjectId(req.params.id);
    db.collection("posts")
      .find({ postedBy: postId })
      .toArray((err, result) => {
        if (err) return console.log(err);
        res.render("page.ejs", {
          posts: result,
        });
      });
  });

  // LOGOUT ==============================
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  // post routes
  app.post("/makePost", upload.single("file-to-upload"), (req, res) => {
    let time = new Date().toLocaleString();

    let user = req.user;
    db.collection("posts").save(
      {
        caption: req.body.caption,
        img: "images/uploads/" + req.file.filename,
        postedBy: user.local.username,
        time,
        like: 0,
        likedBy: [],
        comment: [],

      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/profile");
      }
    );
  });

  // app.post('/postComment', (req, res) => {
  //   let user = req.user._id
  //   db.collection('comments').save({comment: req.body}, (err, result) => {
  //     if (err) return console.log(err)
  //     console.log('saved to database')
  //     res.redirect('/feed')
  //   })
  // })

  // message board routes ===============================================================

  app.put("/likes", (req, res) => {
    const _id = req.body._id;
    user = req.user;
    db.collection("posts").findOneAndUpdate(
      { _id: ObjectId(_id) },
      {
        $inc: {
          like: 1,
        },
      },
      {
        sort: { _id: -1 },
        upsert: true,
      },
      [{$addFields :{likes:{ likedBy: user.local.username}}}],

      (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      }
    );
  });

  app.put("/post/comments/likes", (req, res) => {
    const _id = req.body._id;
    db.collection("posts").findOneAndUpdate(
      { _id: ObjectId(_id) },
      {
        $inc: {
          like: 1,
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

  app.post("/post/comments/submit", (req, res) => {
    let user = req.user;
    let time = new Date().toLocaleString();
    const postId = ObjectId(req.body.postId);

    const newTestObject = {
      commentBy: user.local.username,
      comment: req.body.comment,
      likes: 0,
      likedBy: [],
      liked: false,
      time,
      postId: postId,
    };

    console.log(`POSTID = ${postId}`);

    db.collection("posts").findOneAndUpdate(
      { _id: postId },
      {
        $push: {
          comment: newTestObject,
        },
      },
      {
        sort: { _id: -1 },
        upsert: true,
      },
      (err, result) => {
        if (err) return console.log(err);
        res.redirect("/feed");
      }
    );
  });

  app.delete("/messages", (req, res) => {
    db.collection("messages").findOneAndDelete(
      { name: req.body.name, msg: req.body.msg },
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
  // show the login form
  app.get("/login", function (req, res) {
    res.render("login.ejs", { message: req.flash("loginMessage") });
  });

  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/feed", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
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
