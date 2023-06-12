const WebSocket = require('ws');

// Crea un nuevo servidor WebSocket en el puerto deseado
const wss = new WebSocket.Server({ port: 8080 });

let users = {}

// Evento que se dispara cuando se establece una conexión WebSocket
wss.on('connection', function connection(ws) {
  // Evento que se dispara cuando se recibe un mensaje del cliente
  console.log("conexion establecida entre cliente servidor")
  
  ws.on('message', function incoming(message) {
    const messageParsed = JSON.parse(message)

    //peticion de creacion de usuario
    if(messageParsed.hasOwnProperty("createUserData")){
      const userName = messageParsed.createUserData.publicKey 
      if(users.hasOwnProperty(userName)){
        ws.send("usuario existente, cerrando conexion...")
        ws.close()
      }
      else{
        users[userName] = messageParsed.createUserData
        ws.send("userCreated")      
        console.log("objeto users: ", users)
      }
    }   
       
  });

  // Evento que se dispara cuando se cierra la conexión WebSocket
  ws.on('close', function close() {
    console.log('Conexión cerrada');
  });
});