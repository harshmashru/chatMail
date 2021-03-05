const express = require('express');
const mysql = require('mysql');
const knex = require('knex');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const sortJsonArray = require('sort-json-array');
const otpnum = require("./public/js/otp");
const Nexmo = require("nexmo");
const socketio = require("socket.io");
const cors = require("cors");

app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());    
app.use(cors());

const nexmo = new Nexmo(
    {
      apiKey: "5293d564",
      apiSecret: "UPlr9nA5rkjOscZ4"
    },
    { debug: true }
);

const TWO_HOURS = 1000*60*60*2;

var database = knex({
    client: "mysql",
    connection: {
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "mandesi"
    }
});

app.use('/static', express.static('static'));
// app.set('view engine', 'pug');
//app.set('view engine', 'jade');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use('/public/images/', express.static('./public/images'));
var emailID = "";
var showModal = true;
const {
    PORT = 3000,
    NODE_ENV = 'development',
    SESS_NAME = 'sid',
    SESS_SECRET = 'hmmashru',
    SESS_LIFETIME = TWO_HOURS
} = process.env

const IN_PROD = NODE_ENV === 'production'

app.use(session({
    name: SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESS_SECRET,
    cookie: {
        maxAge: SESS_LIFETIME,
        sameSite: true,
        secure: IN_PROD
    }
}))

const redirectLogin = (req, res, next) => {
    if(!req.session.userID){
        res.redirect('/login')
    } else {
        next()
    }
}

const redirectChatBox = (req, res, next) => {
    if(req.session.userID){
        res.redirect('/chatBox')
    } else {
        next()
    }
}
// app.use((req, res, next) => {
//     const {userID} = req.session
//     if(userID){
//         database
//             .select("*")
//             .from("users")
//             .where("emailID","=", userID)
//             .then(datt => {
//                 if(!datt[0]){
//                     res.send("Invalid")
//                     res.locals.user = null
//                 }
//                 else{
//                     res.locals.user = userID
//                 }
//             })    
//     }
// })

app.get('/', function(req,res){
    const {userID} = req.session
    // res.send(`
    //     <h1> Welcome </h1>
    //     ${userID ? `
    //         <a href='/chatBox'>Home</a>
    //     `:`
    //         <a href='/login'>LogIn</a>
    //         <a href='/signUp'>Register</a>
    //     `}
    // `)
    if(userID){
        res.sendFile(__dirname + '/index.html');
    }
    else{
        res.sendFile(__dirname + '/index.html');
    }          
})

app.get('/login', redirectChatBox, function(req,res){
    // if(emailID!=""){
    //     emailID = "";
    // }
    res.sendFile(__dirname + '/login.html');
})  

app.get('/signUp', function(req,res){
    res.sendFile(__dirname + '/signUp.html');
})

app.get('/chatBox', (req,res) => {
    if(req.session.userID==null){
        res.redirect('/login')
    }
    else{
        res.redirect('/inbox')
    }
})
var mm = null;
var mm2 = null;
var mm3 = null;
app.post('/chatBox', redirectChatBox, function(req,res){
    showModal = false;
    // const { user } = res.locals
    emailID = req.body.emailID;
    const password = req.body.password;
    req.session.userID = null
    if(emailID){
    database
        .select("*")
        .from("users")
        .where("emailID","=", emailID)
        .then(data => {
            if(!data[0]){
                res.send("Invalid emailID");
            }
            else{
                const isValid = password === data[0].password ? true:false;
                if(isValid){
                    req.session.userID = emailID
                    console.log(req.session.userID)
                    //res.sendFile(__dirname+'/inbox.html');
                    //res.json(data[0]);
                    // res.render('inbox.html', {message: });
                    database
                        .select("mto","mfrom","chats","dateTime")
                        .from("conversations")
                        .where("mto","=", data[0].emailID)
                        .then(data3 => {
                            if(data3[0]){
                                const det = [];
                                var  i;
                                var j=0;
                                for(i=Object.keys(data3).length-1; i>=0; i--){
                                    if(j<Object.keys(data3).length){
                                        det[j] = data3[i];
                                        j++;
                                    }
                                    else{
                                        break;
                                    }
                                }
                                //console.log(data3);
                                console.log(det);
                                mm = data[0].name;
                                mm2 = det;
                                mm3 = emailID;
                                res.render('inbox.html', {md: showModal,message: data[0].name,
                                message2: det, message3: emailID})
                            }
                            else{
                                console.log("null");
                                res.render('inbox.html', {md: showModal,message: data[0].name,
                                message2: null, message3: emailID})
                            }
                        })
                }
                else{
                    res.send("Invalid password");
                }
            }
        })
    }
    else{
        res.sendFile(__dirname + '/login.html')
    }
    //res.send("hello there "+username);
})

app.get('/signUpOtp', function(req,res){
    // console.log("Heyy");
    res.sendFile(__dirname + '/signUpOtp.html');
})
var d1 = null;
var d2 = null;
var d3 = null;
var d4 = null;
var d5 = null;
const otp = otpnum();
let fotp = 0;
app.post('/register', function(req,res){
    const {name, emailID, gender, mnumber, cpassword} = req.body;
    database
        .select("*")
        .from("users")
        .where("emailID", "=", emailID)
        .then(data => {
            if(!data[0]){
                d1 = name;
                d2 = emailID;
                d3 = gender;
                d4 = mnumber;
                d5 = cpassword;
                // database("users")
                //     .returning("*")
                //     .insert({
                //         name: name,
                //         emailID: emailID,
                //         mno: mnumber,
                //         gender: gender,
                //         password: cpassword
                //     })
                //     .then(data2 => {
                //         if(!data2[0]){
                //             res.send("fail");
                //         }
                //         else{
                //             res.send("Done");
                //         }
                //     })
                console.log(otp);
                const number = d4;
                const text = `otp is ${otp}`;
                fotp = otp;
                nexmo.message.sendSms(
                "919588279479",
                number,
                text,
                { type: "unicode" },
                (err, responseData) => {
                    if (err) {
                      console.log(err);
                    } else {
                        console.dir(responseData);
                        const data = {
                            id: responseData.messages[0]["message-id"],
                            number: responseData.messages[0]["to"]
                        };
                        io.emit("smsStatus", data);
                        console.log("Done");
                    }
                }
                );
                // res.json("done");
                res.render('signUpOtp.html',{message: null});
            }
            else{
                res.send("Already registered!")
            }
        })
})

app.post('/fromOtp', function(req,res){
    console.log(req.body.otp2);
    const isValid = otp === parseFloat(req.body.otp2) ? true : false;
    console.log(isValid);
    if(isValid){
        database("users")
        .returning("*")
        .insert({
            name: d1,
            emailID: d2,
            mno: d4,
            gender: d3,
            password: d5
        })
        .then(data2 => {
            if(!data2[0]){
                res.send("fail");
            }
            else{
                const mes = "Registered Successfully";
                res.render('signUpOtp.html', {message: mes});
            }
        })
    }
    else{
        res.json("Error");
    }
})

// const d = null;
// app.post('/page', function(req,res){
//     d = req.body.data;
// })

app.post('/sendMessage', redirectLogin, function(req,res){
    const mto = req.body.to;
    const mesg = req.body.message;
    const mfrom = req.body.from;
    let date_ob = new Date();
    //res.sendFile(__dirname + '/response.html');
    database("conversations")
        .returning("*")
        .insert({
            mfrom: mfrom,
            mto: mto,
            chats: mesg,
            dateTime: date_ob
        })
        .then(data => {
            if(data){
                console.log(data);
                //res.send("Sent successfully.");
                res.redirect('/sentBox')
                //alert("Sent successfully.");
            }
            else{
                res.send("Error");
            }
        })
})

app.get('/sentBox', redirectLogin, function(req,res){
    emailID = req.session.userID
    if(emailID){
        database
        .select("*")
        .from("users")
        .where("emailID","=",emailID)
        .then(data2 => {
            if(data2){
                database
                .select("mto","mfrom","chats","dateTime")
                .from("conversations")
                .where("mfrom","=", emailID)
                .then(data => {
                    if(data[0]){
                        //console.log(data);
                        const dat = [];
                        var i;
                        var j=0;
                        for(i=Object.keys(data).length-1; i>=0; i--){
                            if(j<Object.keys(data).length){
                                dat[j] = data[i];
                                j++;
                            }
                            else{
                                break;
                            }
                    }
                    console.log(dat);
                    res.render('sentBox.html', {message: data2[0].name,
                        message2: dat, message3: emailID})    
                    }
                    else{
                        // console.log("null");
                        res.render('sentBox.html', {message: data2[0].name,
                            message2: null, message3: emailID})
                    }
                })
            }
            else{
                res.render('sentBox.html', {message: null})
            }
        })
    }
    else{
        res.sendFile(__dirname + '/login.html')
    }
})

app.get('/inbox', redirectLogin, function(req,res){
    emailID = req.session.userID
    showModal = false;
    if(emailID){
        database
        .select("*")
        .from("users")
        .where("emailID","=",emailID)
        .then(data2 => {
            if(data2){
                database
                .select("mto","mfrom","chats","dateTime")
                .from("conversations")
                .where("mto","=", emailID)
                .then(data3 => {
                    if(data3[0]){
                        const det = [];
                        var  i;
                        var j=0;
                        for(i=Object.keys(data3).length-1; i>=0; i--){
                            if(j<Object.keys(data3).length){
                                det[j] = data3[i];
                                j++;
                            }
                            else{
                                break;
                            }
                        }
                        console.log(det);
                        res.render('inbox.html', {md: showModal,message: data2[0].name,
                        message2: det, message3: emailID})
                    }
                    else{
                        console.log("null");
                        res.render('inbox.html', {md: showModal,message: data2[0].name,
                        message2: null, message3: emailID})
                    }
                })
            }
            else{
                console.log("null");
                res.render('inbox.html', {md: showModal,message: null})
            }
        })
    }
    else {
        res.sendFile(__dirname + '/login.html')
    }
})

app.post('/search',function(req,res){
    
})

app.get('/logout', redirectLogin, function(req,res){
    emailID = null;
    req.session.destroy(err => {
        if(err) {
            return res.send(err)
        }
        res.clearCookie(SESS_NAME)
        res.redirect('/login')
    })
    res.sendFile(__dirname + '/login.html');
})

var naem = "";
app.get('/inbox/:id', (req,res) => {
    if(req.session.userID==null){
        res.redirect('/login')
    }
    else{
        //res.sendFile(__dirname + '/views/chats.html');
        showModal = true;
        console.log(req.params.id);
        if(emailID){
            database
            .select("*")
            .from("users")
            .where("emailID","=",emailID)
            .then(datta => {
                if(datta[0]){
                    var dattaa = [];
                    database
                    .select("mto","mfrom","chats","dateTime")
                    .from("conversations")
                    .where("mto","=", emailID)
                    .where("mfrom","=",req.params.id)
                    .then(datta2 => {
                        console.log("--------------------------");
                        if(datta2){
                            dattaa = dattaa.concat(datta2);
                            sortJsonArray(dattaa,'dateTime','asc');
                            console.log(dattaa);
                        }
                        database
                        .select("mto","mfrom","chats","dateTime")
                        .from("conversations")
                        .where("mfrom","=",emailID)
                        .where("mto","=",req.params.id)
                        .then(datta3 => {
                            console.log("--------------------------");
                            if(datta3){
                                database
                                .select("name")
                                .from("users")
                                .where("emailID","=",req.params.id)
                                .then(nam => {
                                    naem = nam[0].name;
                                    var dattt = [];
                                    // var findat = [];
                                    dattt = dattaa.concat(datta3);
                                    console.log(dattt);
                                    sortJsonArray(dattt,'dateTime','asc');
                                    function getSorted(prop) {
                                        return function(a,b) {
                                            if (a[prop] > b[prop]) {    
                                                return 1;    
                                            } else if (a[prop] < b[prop]) {    
                                                return -1;    
                                            }    
                                            return 0;
                                        }   
                                    }   
                                    const sorted = dattt.sort(getSorted("dateTime"));
                                    console.log(dattt);
                                    console.log(sorted);
                                    // console.log(naem);
                                    res.render('chatss.html',{ md: showModal,message: mm,messagee: dattt,message4: emailID,name: naem });
                                })
                            }
                        })
                    })
                }
                
            })
        }
    }
})

const server = app.listen(3000, ()=>{
    console.log("port is started at 3000");
});

const io = socketio(server);
io.on("connection", socket => {
  console.log("connected");
  io.on("disconnect", () => {
    console.log("Disconnected");
  });
});
