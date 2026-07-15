const express = require('express')
const app = express()

const cookieparser = require('cookie-parser')
const path = require('path')

//this is for db connection
const db = require('./config/mogoose-connection')

//this is for router import
const userRouter = require('./routes/userRouter')
const ownerRouter = require('./routes/ownerRouter')
const productsRouter = require('./routes/productsRouter')

//basics
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieparser())
app.use(express.static(path.join(__dirname,"public0")))
app.set("view engin","ejs");

app.use("/Users",userRouter);
app.use("/Owners",ownerRouter);
app.use("/Products",productsRouter);


app.listen(3000)