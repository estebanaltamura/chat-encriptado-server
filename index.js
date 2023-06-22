const WebSocket = require('ws');

// Crea un nuevo servidor WebSocket en el puerto deseado
const wss = new WebSocket.Server({ port: 8080 });

const users = {}
const pairs = []

// Evento que se dispara cuando se establece una conexión WebSocket
wss.on('connection', function connection(ws) {

  let userName = null
  let nickName = null

  // Evento que se dispara cuando se recibe un mensaje del cliente
  console.log("conexion establecida entre cliente servidor")
  
  ws.on('message', function incoming(message) {
    const messageParsed = JSON.parse(message)

    //peticion de creacion de usuario
    if(messageParsed.hasOwnProperty("createUserData")){
      userName = messageParsed.createUserData.publicKey 
      nickName = messageParsed.createUserData.nickName

      if(users.hasOwnProperty(userName)){
        ws.send("usuario existente, cerrando conexion...")
        // enviar un popup
        ws.close()
      }
      else{
        messageParsed.createUserData.connection = ws
        const {publicKey, ...rest} = messageParsed.createUserData
        users[userName] = rest

        ws.send(JSON.stringify({"userCreated": "userCreated"}))        
        console.log("users actualizado: ", users)
      }
    } 
    
    

    //busqueda de par

    //dejar en el servidor el control del to para evitar la posibilidad de hackeo a las puntas

    //si es este tipo de request, si esta dentro de los usuarios online y si no es el mismo usuario generar un alert en el otro, 
    //si confirma se guardan en el front los to y se abre la pantalla de chat
    
    
    
    if(messageParsed.hasOwnProperty("tryPairing")){      
      const user2 = messageParsed.tryPairing.publicKeyUser2      

      if(userName === user2){
        const requestMessage = JSON.stringify({"error": "errorUserIsTheSame"})
        users[userName].connection.send(requestMessage)   
      }
      
      else if(!users.hasOwnProperty(user2)){        
        console.log("user2", user2)
        console.log("user1", userName)
        const requestMessage = JSON.stringify({"error": "errorUserDoesntExistOrReject"})        
        const timeOut = setTimeout(()=>{
          users[userName].connection.send(requestMessage)
          clearTimeout(timeOut)
        },30000)        
      }
      
      else if(users.hasOwnProperty(user2)){        
        const requestMessage = JSON.stringify({"requestConnection": {"userName": userName, "nickName": nickName}})
        users[user2].connection.send(requestMessage)        
      }          
    }    
    

    if(messageParsed.hasOwnProperty("confirmedRequest")){
      //Asignar el user de la contra parte en el TO
      const user1 = messageParsed.confirmedRequest.user1
      const user2 = messageParsed.confirmedRequest.user2                
      users[user1].to = user2
      users[user2].to = user1   
      const requestMessageUser1 = JSON.stringify({"chatConfirmed": {"to": user2}})
      const requestMessageUser2 = JSON.stringify({"chatConfirmed": {"to": user1}})
      users[user1].connection.send(requestMessageUser1) 
      users[user2].connection.send(requestMessageUser2) 
    }

    if(messageParsed.hasOwnProperty("rejectedRequest")){
      const user1 = messageParsed.rejectedRequest.user1      
      const requestMessageUser1 = JSON.stringify({"error": "errorUserDoesntExistOrReject"})
      users[user1].connection.send(requestMessageUser1) 
    }
    

    
    if(messageParsed.hasOwnProperty("requestCloseConnection")){      
      const user2 = messageParsed.requestCloseConnection.publicKeyUser2          
      users[user2].connection.close()      
    }   

    



    //enviar mensaje al par
    //si el from del otro es el to del que manda, mandar
    if(messageParsed.hasOwnProperty("regularMessage")){
      const {from, to, message} = messageParsed.regularMessage

      users[to].connection.send(message)
      console.log("mensaje enviado de: ", from, "a: ", to, "mensaje: ", message)
      
    }
       
  });

  // Evento que se dispara cuando se cierra la conexión WebSocket
  ws.on('close', function close() {
    
    //en etapa de chat si uno cierra el otro recibe un mensaje interno y se cierra forzadamente
       
    delete users[userName]

    console.log("users actualizado", users)
    //console.log('Conexión cerrada', "publicKey: ", userName, "nick name: ", nickName);
  });
});