const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;


// Configuration du server
let express = require('express');
let path = require('path');


let port = 8080;
let server = express();

// Dossier statique de la partie front
server.set('views', path.join(__dirname, 'www'));
server.use(express.static(path.join(__dirname, 'www')));



//connexion à mongo
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');
//connexion avec socket.io
    server.listen(port, () => {
        console.log('Server is listening')

        client.on('connection', function(socket){
            let chat = db.collection('chats');
    
          //creer une fct pr envoyer le status 
            sendStatus = function(s){
                socket.emit('status', s);
            }
    
           //recuperer le chat de mongo 
            chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
                if(err){
                    throw err;
                }
    
                //emmetre les msg
                socket.emit('output', res);
            });
    
            //emmetre les evenements d'entrée
            socket.on('input', function(data){
                let name = data.name;
                let message = data.message;
    
                //verifier le nom et le msg
                if(name == '' || message == ''){
                    //signalisation d'erreurs
                    sendStatus('Veuillez entrer un message et un nom');
                } else {
                    //insere le msg
                    chat.insert({name: name, message: message}, function(){
                        client.emit('output', [data]);
    
                        //notif de message envoyé
                        sendStatus({
                            message: 'Message sent',
                            clear: true
                        });
                    });
                }
            });
    
            
            socket.on('clear', function(data){
                
                chat.remove({}, function(){
                    
                    socket.emit('cleared');
                });
            });
        });
    })

    
    
});