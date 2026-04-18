const express = require('express');
require('./db/config');
const cors = require('cors');
const User = require('./db/User');
const Product = require('./db/Product');
const app = express();
app.use(express.json());
app.use(cors());

const Jwt = require('jsonwebtoken');
const jwtKey = "e-comm";

app.post("/register", async (req, res) => {
    console.log("Starting registration process...");
    let user = new User(req.body);
    let result = await user.save();
    console.log("User Registered: " + result);
    res.send(result);
});

app.post("/login", async (req, resp) => {
    console.log("Login attempt with email: " + req.body.email);
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    console.error("Error generating JWT token: ", err);
                    resp.send({ result: "Something Went wrong, Please try after some time..!" })
                }
                console.log("Login successful, token generated: " + token);
                resp.send({ user, auth: token })
            })
        }
        else {
            console.log("Login failed: User not found with provided credentials.");
            resp.send({ result: "Not Found" })
        }
    }
    else {
        console.log("Login failed: Email or password not provided.");
        resp.send({ result1: "Not Found" })
    }
});

app.post("/add-product", verifyToken, async (req, resp) => {
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
})

app.get('/products', verifyToken, async (req, resp) => {
    let products = await Product.find();
    if (products.length > 0) {
        resp.send(products)
    }
    else {
        resp.send({ result: "No Product Found.." })
    }
})

app.delete("/products/:id", verifyToken, async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result);
})

app.get("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
        resp.send(result);
    }
    else {
        resp.send({ result: "No Record Found..!" });
    }
})

app.put("/product/:id", async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    resp.send(result);
});

app.get("/search/:key", verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } }
        ]
    });
    resp.send(result);
});

function verifyToken(req, resp, next) {
    let token = req.headers['authorization'];
    //  console.warn("Middleware Called..!", token);
    if (token) {
        token = token.split(' ')[1];
        // console.warn("middleware called if", token);
        Jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "Please Provide Valid Token...!" })
            }
            else {
                next();
            }
        })
    }
    else {
        resp.status(403).send({ result: "Please Add token with header...!" })
    }
}


app.listen(5000);

//UI and Backend projects are running on two different ports,
// so we need to enable CORS in our backend project to allow cross-origin
// requests from the frontend.
// We can do this by installing the 'cors' package and using it as middleware
// in our Express app.
// npm i cors
