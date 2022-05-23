const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 6060;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hvdeh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const productsCollection = client.db("estroGadget").collection("products");
    const reviewsCollection = client.db("estroGadget").collection("reviews");

    app.get("/products",async(req,res)=>{
      const products = await productsCollection.find({}).toArray();
      res.send(products);
    })
    app.get("/reviews",async(req,res)=>{
      const reviews = await reviewsCollection.find({}).toArray();
      res.send(reviews);
    })
    
  } finally {
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Estro Gadget Server is Running");
});

app.listen(port);
