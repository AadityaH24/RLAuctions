//jshint esversion: 6
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const { urlencoded } = require('body-parser');
const { decode } = require('punycode');
const stringSimilarity = require('string-similarity');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var curuser = {}; //current user

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

//signin
app.get('/', function(req, res){
       res.render('index');
       var check = 0;
       app.post("/goingin", function(req,res){
        var email = req.body.email;
        var password = req.body.password;
        axios.get('https://onlineauction-12153.firebaseio.com/user/.json')
        .then(function(response){
            if(response.data === null){
                res.render('success', {message: "Your Username or Password Is Incorrect, Please Try Again", link: "/index"});}
            for( var key of Object.keys(response.data)) {
            
            if(email === response.data[key]["email"] && password === response.data[key]["password"] ){
                curuser = response.data[key];
                check = 1;
                res.redirect('/list'); 
                }                                 
            }
            res.render('success', {message: "Your Username or Password Is Incorrect, Please Try Again", link: "/index"});             
        })
        .catch(function(error){
            console.log(error);
        })            
    });
});

//index
app.get('/index', function(req, res){
    res.redirect('/');
});

//success
app.get('/success', function(req, res){
    res.render('success');
});

// signup
app.get('/signup', function(req, res){
    res.render('signup');
    var check = 0;
    app.post("/success", function(req,res){
        var email = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var data = {
            "username": username,
            "password": password,
            "email": email
        };
        
        axios.get('https://onlineauction-12153.firebaseio.com/user/.json')
        .then(function(response){
            for( var key of Object.keys(response.data)) {
            if(username === response.data[key]["username"]){
                check = 1;
                }                       
            }             
        })
        .catch(function(error){
            console.log(error);
        })

        if(check === 1){
        res.render('success', {message: "This Username Has Already Been Taken, Please Enter A Different One", link: "/signup"});
        check = 0;    
        }

        else{
            axios.post('https://onlineauction-12153.firebaseio.com/user/.json', data)
                .then(function(response){
                    res.render('success', {message: "Your Profile Has Been Successfully Created! Please Sign In to Continue Your Experience", link: "/index"});

                })
                .catch(function(error){
                    console.log(error);
                })
            }   
        });        
});


//list page
app.get('/list', function(req, res){
    axios.get('https://onlineauction-12153.firebaseio.com/auctions.json')
        .then(function(response){
            var size = 0;
            if(response.data != null)
                var size = Object.keys(response.data).length;
            res.render('list', {data: response.data, size: size});

        })
        .catch(function(error){
            console.log(error);
        })

    app.post('/search', function(req, res){
        var category = req.body.category;
        axios.get('https://onlineauction-12153.firebaseio.com/auctions/.json')
        .then(function(response){
            if(response.data!=null){
                res.render('search', {category: category, data: response.data})
            }            
        })
        .catch(function(error){
            console.log(error);
        })
            
    })

    app.post('/search2', function(req, res){
        query = req.body.query;
        axios.get('https://onlineauction-12153.firebaseio.com/auctions/.json')
            .then(function(response){
                if(response.data!=null){
                    res.render('search2', {data: response.data, query: query, stringSimilarity: stringSimilarity});
                }
            })
    })
             
});


app.get('/help', function(req, res){
    res.render('help');
})


var curitem = {};
var curitemid = "";

//bid on item
app.get('/list/:id', function(req, res){
    axios.get('https://onlineauction-12153.firebaseio.com/auctions/' + req.params.id + '.json')
    .then(function(response){
        curitem = response.data;
        curitemid = req.params.id;
        res.redirect('/bid');
        
    })
    .catch(function(error){
        console.log(error);
    })
})



//bid
app.get('/bid', function(req,res){
    res.render('bid', {data: curitem});
    app.post("/successbid", function(req, res){
            
            var bidamount = req.body.bidprice;
            //if bidding amount is more than the prev bid
            if(parseInt(curitem["cprice"]) < parseInt(bidamount)){
                
            curitem["cprice"] = bidamount;
            curitem["win1"] = curuser["username"];
            axios.patch('https://onlineauction-12153.firebaseio.com/auctions/' + curitemid + '.json', curitem)
            .then(function(response){
                var userbid = {
                    "username": curuser["username"],
                    "bidid": curitemid
                };
                axios.post('https://onlineauction-12153.firebaseio.com/userbids.json', userbid)
                    .then(function(response){
                        })
                    .catch(function(error){
                        console.log(error);
                    })
                res.render('success', {message: "Your Bid Has been Placed Successfully!", link: "/list"});
            })
            .catch(function(error){
                console.log(error);
            })
        }

            //else
            else{
                res.render('success', {message: "Your Bid Value Needs to be Higher than the Previous Bid Value", link: "/bid"});
            }
    })


    //view other profiles
    app.post("/something", function(req, res){
        var userauctions = [];
        var userprofile = {
            "username": decodeURI(req.body.otherusername),
            "email": "",
        };
        console.log(req.body.otherusername)
        axios.get('https://onlineauction-12153.firebaseio.com/user/.json')
            .then(function(response){
                if(response.data!=null){
                    for( var key of Object.keys(response.data)) {
                        if(req.params.id === response.data[key]["username"]){
                            userprofile["email"] = response.data[key]["email"];
                        }           
                    }
                }      
            })

            .catch(function(error){
                console.log(error);
            })

            axios.get('https://onlineauction-12153.firebaseio.com/auctions/.json')
            .then(function(response){
                if(response.data!=null){
                    for( var key of Object.keys(response.data)) {
                        if(userprofile["username"] === response.data[key]["poster"]){
                        userauctions.push(response.data[key]);    
                        }           
                    }
                }
            
                res.render("otherprofile", {username: userprofile["username"], email: userprofile["email"], auctions: userauctions, size: userauctions.length});             
            })
            .catch(function(error){
                console.log(error);
            })
    });

})



//add auction
app.get("/add", function(req, res){
    res.render("add");
    app.post("/successitem", function(req,res){
        var name = req.body.pname;
        var price = req.body.bprice;
        var info = req.body.info;
        var data = {
            "bprice": price,
            "cprice": price,
            "increment":0,
            "info":info,
            "name":name,
            "poster":curuser["username"],
            "win1":"",
            "status": 1
        }

            axios.post('https://onlineauction-12153.firebaseio.com/auctions/.json', data)
            .then(function(response){
                console.log("Success")
                res.render('success', {message: "Your Prouct Has Been Listed Successfully!", link: "/list"});
            })
            .catch(function(error){
                console.log(error);
            })
       
       
    })
})



//profile
app.get("/profile", function(req, res){
   
    
    axios.get('https://onlineauction-12153.firebaseio.com/auctions/.json')
        .then(function(response1){
            if(response1.data!=null){
                axios.get('https://onlineauction-12153.firebaseio.com/userbids/.json')
                    .then(function(response2){
                        
                            res.render("profile", {username: curuser["username"], email: curuser["email"], auctions: response1.data, userbids: response2.data});
                        
                    })
                    .catch(function(error){
                        console.log(error);
                    })
                
                }
            })
        .catch(function(error){
            console.log(error);
        })
    
    app.post('/logout', function(req, res){
        curuser = {};
        res.render('success', {message: "You have been logged out successfully", link: "/index"});
    })

    app.post('/delete', function(req,res){
        var itemID = req.body.deleteItem;
        var delItem = {};
        axios.get('https://onlineauction-12153.firebaseio.com/auctions/' + itemID + '.json')
            .then(function(response){
                delItem = response.data;
                delItem["status"] = 0;
                console.log(delItem);
                axios.patch('https://onlineauction-12153.firebaseio.com/auctions/' + itemID + '.json', delItem);
                res.render('success', {message: "This auction has been closed successfully", link: "/profile"});
            })
            .catch(function(error){
                console.log(error);
            })

    })

   
    
})


app.listen(3000);


