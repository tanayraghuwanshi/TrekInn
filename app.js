if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}
// 
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const passport = require("passport");
const LocalStratergy = require("passport-local");
const User =  require("./models/user.js");

const session = require("express-session");
const flash = require("connect-flash");

const mongoose = require("mongoose");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const mongoUrl = "mongodb://127.0.0.1:27017/wanderlust";

main().then((res) => {
    console.log("Database Connected Succesfully");
}).catch((err) => console.log(err));

async function main(){
    await mongoose.connect(mongoUrl);
}


const port = 8080;

const sessionOptions = {
    secret: "mysupersceretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};


app.get("/", (req, res) => {
    console.log("Root");
})

app.use(session(sessionOptions));
app.use(flash());

// passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// flash middleware (app.js)
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// current user middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user; // passport user
    next();
});



const listingRoute = require("./routes/listing.js");
const reviewsRoute = require("./routes/review.js");
const userRoute = require("./routes/user.js");


app.use("/listings", listingRoute);
app.use("/listing/:id/reviews", reviewsRoute);
app.use("/user", userRoute);

// app.get("/user", async (req, res) => {
//     const fakeUser = new User({
//         email: "fakeuser@gmail.com",
//         username: "fakeuser"
//     })

//     let user = await User.register(fakeUser, "12345678"); 
//     res.send(user);
// })

app.all(/.*/, (req, res, next) => {
    console.log("🔥 Catch-all hit");
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    console.log("⚠️ Error caught:", err.message);
    res.status(err.statusCode || 500).render("error", { err });
});


app.listen(port, () => {
    console.log("Listening");
})

