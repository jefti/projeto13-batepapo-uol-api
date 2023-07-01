import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';

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

//3. Validação por Joi

const participantSchema = joi.object({
    name: joi.string().required(),
    lastStatus: joi.required()
});

const mensagemSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    type: joi.string().valid('message','private_message').required(),
    text: joi.string().required(),
    time: joi.required()
})


//4. Funções de Endpoint
app.get("/",(req,res)=>{
    res.send("Teste");
});

    //4.1 funções Get
app.get("/participants",async (req,res)=>{
    try{
        await db.collection("participants").find().toArray()
            .then( participantes => res.send(participantes))
    }catch(err){
        return res.status(500).send(err.message);
    }
});

app.get("/messages",async (req,res)=>{
    const user = req.headers.user;
    const limit = Number(req.query.limit);
    try{
        if(limit){
            if(limit <= 0 || isNaN(limit)){
                return res.status(422).send('O limite informado é inválido');
            }
            const mensagens = await db.collection("messages").find({$or: [{from:user},{to:user},{to:"Todos"}]}).limit(limit).toArray()
            return res.send(mensagens);
        } else {
            const mensagens = await db.collection("messages").find({$or: [{from:user},{to:user},{to:"Todos"}]}).toArray()
            return res.send(mensagens);
        }
    }catch (err){
        return res.status(500).send(err.message);
    }

});

    //4.2 funções Post
app.post("/participants", async (req,res)=>{
    const {name} = req.body;

    try{
        const resp = await db.collection("participants").findOne({name});
        if (resp) return res.status(409).send("Nome já está em uso");
        const obj = {name, lastStatus: Date.now()};
        const mensagem = {from:name, to:'Todos',text:'entra na sala...',type:'status',time:dayjs().format('HH:mm:ss')}
        const validation = participantSchema.validate(obj);
        if (validation.error){
            const erros = validation.error.details.map((detail)=> detail.message);
            return res.status(422).send(erros);
        }
        await db.collection("participants").insertOne(obj);
        await db.collection("messages").insertOne(mensagem);
        return res.sendStatus(201);
    } catch(err) {
        return res.status(500).send(err.message);
    }


});
    
app.post("/messages",async (req,res)=>{
    const {to, text, type} = req.body;
    const user = req.headers.user;
    try{
        const resp = await db.collection("participants").findOne({name: user});
        if(!resp) return res.status(422).send('Usuario não está na lista!');
        const obj = {from: user,to,type,text,time:dayjs().format('HH:mm:ss')};
        const validation = mensagemSchema.validate(obj);
        if(validation.error){
            const errors = validation.error.details.map((detail)=> detail.message);
            return res.status(422).send(errors);
        }
        await db.collection("messages").insertOne(obj);
        return res.sendStatus(201);
    }catch (err){
        return res.status(500).send(err.message);
    }

});

app.post("/status",async (req,res)=>{
    const User = req.headers.user;
    try{
        if (!User) return res.sendStatus(404);
        const resp = await db.collection("participants").findOne({name:User});
        if(!resp) return res.status(404).send('Usuario não está na lista de participantes');
        const patch = {_id: resp._id, name:resp.name, lastStatus: Date.now()};
        await db.collection("participants").updateOne(
            {name: User},
            {$set: patch}
        );
        const atualizacao = await db.collection("participants").findOne({name:User});
        return res.send(atualizacao);
    }catch (err){
        return res.status(500).send(err.message);
    }
});

//5. Função de desolgar usuarios desativos 
async function Desligar(){
    const tempo = Date.now()-10000;
    const lista = await db.collection("participants").find({ lastStatus: { $lt: tempo } }).toArray();
    lista.forEach((el)=>{
        db.collection("participants").deleteOne({_id: new ObjectId(el._id)})
            .then(
                db.collection("messages").insertOne({from:el.name , to:"Todos",text:"sai da sala",type:"status",time:dayjs().format('HH:mm:ss')})
            );
    });
}

setInterval(Desligar,10000);


//6. Ligar na porta específicada
const Port = 5000;
const now = new Date;
const nomeDia = ["Domingo", "Segunda", "Terça","Quarta","Quinta","Sexta","Sábado"];
const nomeMes = ["Janeiro", "Fevereiro","Março","Abril","Maio","Junho","JUllho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
app.listen(Port, ()=> {
console.log(`Servidor rodando na porta ${Port}`)
});