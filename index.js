const express= require ('express');
const app=express();
const cookieParser=require('cookie-parser')
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken')
const path = require('path')
const userModel=require('./Models/user');
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'Public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.render('Home');
   })
app.get('/register',function (req,res) {
    res.render('Register');
    
})
app.post('/login',async (req,res)=>{
    let {mail,pass}=req.body;
    console.log(req.body);
    let user=await userModel.findOne({mail});
    if(!user)return res.send("something went wrong");
    bcrypt.compare(req.body.pass, user.pass, function(err, result) {
        if(result)
            {
                let token=jwt.sign({mail:user.mail},"secret");
                res.cookie("token",token);
                res.send("rvrbbb");
            }
            else
            res.send("something went wrong");
        });
})
app.post('/register',(req,res)=>{
    bcrypt.genSalt(10, function(err, salt) {
    let {fname,lname,mob,mail,address,git,pass}=req.body;

       bcrypt.hash(pass, salt, async function(err, hash) {
       let user=await userModel.create({
        fname:fname,
                lname:lname,
                address:address,
                mob:mob,
                git:git,
                mail:mail,
           pass:hash
       })
       // to save user credential in browser
       let token=jwt.sign({mail},"secret");
       res.cookie("token",token);
       res.send("Logged it");
       });});
  
})

app.get('/main',function (req,res) {
    res.render('Main');
    
})

app.listen(3000);