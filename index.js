const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
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
    const userCollection = client.db("estroGadget").collection("user");
    const blogsCollection = client.db("estroGadget").collection("blogs");
    const orderCollection = client.db("estroGadget").collection("orders");
    const profileUpdate = client.db("estroGadget").collection("profile");

    // const verifyAdmin = async (req, res, next) => {
    //   const requester = req.decoded.email;
    //   const requesterAccount = await userCollection.findOne({ email: requester });
    //   if (requesterAccount.role === 'admin') {
    //     next();
    //   }
    //   else {
    //     res.status(403).send({ message: 'forbidden' });
    //   }
    // }

    app.get("/products", async (req, res) => {
      const products = await productsCollection.find({}).toArray();
      res.send(products);
    });
    app.get("/products/:_id", async (req, res) => {
      const id = req.params._id;
      const query = { _id: ObjectId(id) };
      console.log(id);
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const reviews = await reviewsCollection.find({}).toArray();
      res.send(reviews);
    });
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find({}).toArray();
      res.send(users);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      res.send({ result, token });
    });

    app.get("/product", verifyJWT, async (req, res) => {
      const products = await productsCollection.find().toArray();
      res.send(products);
    });
    app.get("/blogs", async (req, res) => {
      const blogs = await blogsCollection.find().toArray();
      res.send(blogs);
    });

    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const order = await orderCollection.find(query).toArray();
      res.send(order);
      console.log(email, order);
    });

    app.post("/product", verifyJWT, async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send({ success: true, result });
    });
    app.post("/reviews", verifyJWT, async (req, res) => {
      const reviews = req.body;
      const result = await reviewsCollection.insertOne(reviews);
      res.send(result);
    });

    app.post("/profile", async (req, res) => {
      const profile = req.body;
      const result = await profileUpdate.insertOne(profile);
      res.send({ success: true, result });
    });

    app.delete("/user/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    });
    // app.delete("/product/:id", verifyJWT, async (req, res) => {
    //   const email = req.params.email;
    //   const filter = { email: email };
    //   const result = await userCollection.deleteOne(filter);
    //   res.send(result);
    // });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Estro Gadget Server is Running");
});

app.listen(port);
