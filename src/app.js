import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

//1. Criar o app
const app = express();

//2. Configurações
app.use(cors());
app.use(express.json());
dotenv.config();

//3. Conexão com o banco de dados
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db

mongoClient.connect()
    .then(()=> db = mongoClient.db())
    .catch((err)=> console.log(err.message));


//3. Funções de Endpoint
app.get("/",(req,res)=>{
    res.send("Servidor Online!!!");
});

    //3.1 funções Get
app.get("/participants",(req,res)=>{
    res.send("Retornado lista de participantes");
});

app.get("/messages",(req,res)=>{
    res.send("Retornado lista de mensagens");
});

    //3.2 funções Post
app.post("/participants",(req,res)=>{
    res.send("Atualizado lista de participantes");
});
    
app.post("/messages",(req,res)=>{
    res.send("Atualizado lista de mensagens");
});

app.post("/status",(req,res)=>{
    res.send("Atualizado Status");
});



//4. Ligar na porta específicada
const Port = 5000;
app.listen(Port, ()=> console.log(`Servidor rodando na porta ${Port}`));