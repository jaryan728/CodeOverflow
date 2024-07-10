const express= require ('express');
const app=express();
const cookieParser=require('cookie-parser')
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken')
const path = require('path')

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')


app.get('/', function (req, res) {
    res.render('Home');
   })
app.get('/register',function (req,res) {
    res.render('Register');
    
})
app.listen(3000);