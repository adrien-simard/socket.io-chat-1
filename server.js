var express = require('express');
// import des models et de mongo
var User = require("./models/user");
var Message = require("./models/messages");
var mongoose = require('mongoose');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var i;
var usersConnected;

// import de redis client
const redis = require("redis");
const client = redis.createClient();
const clientmess = redis.createClient();
var alert = require('alert');

client.on("error", function(error) {
  console.error(error);
});
client.on("error", function(error) {
  console.error(error);
});

client.on("ready", function(error) {
  console.log("Connected to redis")
});

/**
 * Gestion des requêtes HTTP des utilisateurs en leur renvoyant les fichiers du dossier 'public'
 */
 app.use('/', express.static(__dirname + '/public'));

 

 /**
  * Liste des utilisateurs connectés
  */
 var users = [];

 client.del("users");
 
 /**
  * Historique des messages
  */
 var messages = [];
 
 /**
  * Liste des utilisateurs en train de saisir un message
  */
 var typingUsers = [];
 
 io.on('connection', function (socket) {
 
   /**
    * Utilisateur connecté à la socket
    */
   var loggedUser;
 
   /**
    * Emission d'un événement "user-login" pour chaque utilisateur connecté
    */
   for (i = 0; i < users.length; i++) {
     socket.emit('user-login', users[i]);
     // création de l'utilisateur et ajout a sa connection
     var utilisateur = new User({
      username: users[i].username,
    });
    console.log(users[i].username);
    utilisateur.save(function (err) {
     if (err) throw err;
 });
   }
 
   /** 
    * Emission d'un événement "chat-message" pour chaque message de l'historique
    */
   for (i = 0; i < messages.length; i++) {
     if (messages[i].type === 'chat-message') {
       socket.emit('chat-message', messages[i]);
       
     } else {
       socket.emit('service-message', messages[i]);
       
     }
   }
 
   /**
    * Déconnexion d'un utilisateur
    */
   socket.on('disconnect', function () {

     if (loggedUser !== undefined) {
       // Broadcast d'un 'service-message'
       var serviceMessage = {
         text: 'User "' + loggedUser.username + '" disconnected',
         type: 'logout'
       };
       socket.broadcast.emit('service-message', serviceMessage);

       // supression liste des connectés dans redis
       client.lrem(['users',0, loggedUserAsString], function(err, reply) { //REDIS - On enlève l'user de la db, on utilise la version stringifiée du json
	      	if (err) throw err;
	    	console.log(reply); // On s'assure que la suppression s'est bien faite
		  });
		  client.lrange("users",0,-1, function(err,reply) { // on remet à jour la variable users
		  	if (err) throw err;
			users=reply;
		  });
       // Suppression de la liste des connectés
       var userIndex = users.indexOf(loggedUser);
       if (userIndex !== -1) {
         users.splice(userIndex, 1);
       }
       // Ajout du message à l'historique
       messages.push(serviceMessage);
       // Emission d'un 'user-logout' contenant le user
       io.emit('user-logout', loggedUser);
       // Si jamais il était en train de saisir un texte, on l'enlève de la liste
       var typingUserIndex = typingUsers.indexOf(loggedUser);
       if (typingUserIndex !== -1) {
         typingUsers.splice(typingUserIndex, 1);
       }
     }
   });
 
   /**
    * Connexion d'un utilisateur via le formulaire :
    */
   socket.on('user-login', function (user, callback) {

     // Vérification que l'utilisateur n'existe pas
     var userIndex = -1;
     for (i = 0; i < users.length; i++) {
       if (users[i].username === user.username) {
         userIndex = i;
       }
     }

     if (user !== undefined && userIndex === -1) { // S'il est bien nouveau
       // Sauvegarde de l'utilisateur et ajout à la liste des connectés
       loggedUser = user;
       users.push(loggedUser);
       loggedUserAsString = JSON.stringify(loggedUser);// Stringificaiton du document pour l'ajouter dans redis et le recupérer en tant que que document avec json.parse
       
       client.rpush(['users', loggedUserAsString], function(err, reply) {   
         // REDIS - Ajout de l'user à la db
        if (err) throw err;
        console.log(reply); // On s'assure que l'ajout s'est bien fait
        
       });
		  	client.lrange("users",0,-1, function(err,reply) { // on remet à jour la variable users avec les données de redis
		  		if (err) throw err;
				users=reply;
        //affichage de la liste des users
        console.log(users)
		  	});

       // Envoi et sauvegarde des messages de service
       var userServiceMessage = {
         text: 'You logged in as "' + loggedUser.username + '"',
         type: 'login'
       };

       var broadcastedServiceMessage = {
         text: 'User "' + loggedUser.username + '" logged in',
         type: 'login'
       };
       socket.emit('service-message', userServiceMessage);
       socket.broadcast.emit('service-message', broadcastedServiceMessage);
       messages.push(broadcastedServiceMessage);
       // Emission de 'user-login' et appel du callback
       io.emit('user-login', loggedUser);
       callback(true);
     } else {
       callback(false);
     }
   });
 
   /**
    * Réception de l'événement 'chat-message' et réémission vers tous les utilisateurs
    */
   socket.on('chat-message', function (message) {
     // On ajoute le username au message et on émet l'événement
     message.username = loggedUser.username;
     // On assigne le type "message" à l'objet
     message.type = 'chat-message';
     io.emit('chat-message', message);
     // Sauvegarde du message
      messages.push(message);

      // sauvegarde sur mongo du chat-message 
      var mess = new Message({
        content: message.text,
        utilisateur: loggedUser.username
      });
      console.log(message.text);
      mess.save(function (err) {
       if (err) throw err;
   });
   // ajout message ephémère dans REDIS
   //temporaryStore(message.text)


     if (messages.length > 150) {
       messages.splice(0, 1);
     }
   });
 
   /**
    * Réception de l'événement 'start-typing'
    * L'utilisateur commence à saisir son message
    */
   socket.on('start-typing', function () {
     // Ajout du user à la liste des utilisateurs en cours de saisie
     if (typingUsers.indexOf(loggedUser) === -1) {
       typingUsers.push(loggedUser);
     }
     io.emit('update-typing', typingUsers);
   });
 
   /**
    * Réception de l'événement 'stop-typing'
    * L'utilisateur a arrêter de saisir son message
    */
   socket.on('stop-typing', function () {
     var typingUserIndex = typingUsers.indexOf(loggedUser);
     if (typingUserIndex !== -1) {
       typingUsers.splice(typingUserIndex, 1);
     }
     io.emit('update-typing', typingUsers);
   });
 });


var connStr = 'mongodb://localhost:27017/chat';
mongoose.connect(connStr, function (err) {
    if (err) throw err;
    console.log('Successfully connected to MongoDB');
});

/**
 * Lancement du serveur en écoutant les connexions arrivant sur le port 8001
 */
http.listen(8001, function () {
  console.log('Server is listening on *:8001');
});

// Quelques rêquêtes pertinentes 

function getAllMessages(){
  // avoir tout les messages 
  Message.find({}).exec(function (err,res){
    console.log(res);
  })
}
// getAllMessages();

function getAllUserMessage(username) {
	// Pour avoir le nombre de message total (toutes rooms confondues) d'un utilisateur
	Message.find({utilisateur:username}).exec(function(err,res) {
		console.log(res);
	})
}
//getAllUserMessage("adrien");

function getAllUserMessageNum(username) {
	// Pour avoir le nombre de message total (toutes rooms confondues) d'un utilisateur
	Message.find({utilisateur:username}).count().exec(function(err,res) {
    console.log("nb de messages :")
		console.log(res);
	})
}
//getAllUserMessageNum("adrien");


function getBonjour(){
  Message.find({content:"bonjour"}).exec(function (err,res){
    console.log(res);
  })
}
// getBonjour();

function temporaryStore(message){
  /** cette methode stocke temprairement les messages dans redis (10 min) cela pourrait être utile pour faire des messageries temporaires */ 
  clientmess.rpush(['messa', message], function(err, reply) {   
    // REDIS - Ajout de l'user à la db
   if (err) throw err;
   console.log(reply); // On s'assure que l'ajout s'est bien fait
   
  });
  clientmess.expire('messa', 1200)
   
}
function ShowtemporaryMessage(){
  clientmess.lrange("messa",0,-1, function(err,reply) { // on remet à jour la variable users avec les données de redis
    if (err) throw err;
  users=reply;
  //affichage de la liste des users
  console.log(users)
  });
}

//Pouvoir afficher une conversation précédente (10 derniers messages)
function ShowChat(){
  Message.find({}).sort({date: -1}).limit(10).exec(function(err,res) {
    console.log(res);
    })
}
ShowChat()

function getUsersActivity() {
	// Pour l'utilisateur le plus actif
	Message.aggregate([{$group:{_id:{username:"$username"},"nbOfMessage":{$sum:1}}}]).exec(function(err,res) {
	console.log(res);
	})
}
//getUsersActivity();
