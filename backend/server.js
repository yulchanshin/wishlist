import express from "express"
import helmet from "helmet"
import morgan from "morgan"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config();

const app = express(); 
const PORT = process.env.PORT || 3000;

app.use(express.json())//parses the incoming data to json format
app.use(cors())
app.use(helmet()) //this is a security middleware that helps to protect the app by 
//setting various http headers
app.use(morgan('dev')) //logs the requests

app.get("/", (req, res)=>{
    res.send("Hello from the backend")
})

app.get("/test", (req, res)=>{
    res.send("Hello from the test")
})

app.listen(PORT, ()=> {
    console.log(`server is running on port ${PORT}`)
})