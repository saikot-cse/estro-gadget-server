const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 6060;

app.get("/", async(req,res)=>{
 res.send("Estro Gadget Server is Running")
})

app.listen(port);
