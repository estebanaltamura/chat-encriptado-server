const WebSocket = require('ws');

// Crea un nuevo servidor WebSocket en el puerto deseado
const wss = new WebSocket.Server({ port: 4000 });

const users = {}


// Evento que se dispara cuando se establece una conexión WebSocket
wss.on('connection', function connection(ws) {

  let userName = null
  let nickName = null

  // Evento que se dispara cuando se recibe un mensaje del cliente
  console.log("conexion establecida entre cliente servidor")
  
  ws.on('message', function incoming(message) {
    
    const messageParsed = JSON.parse(message)

    //console.log("mensaje recibido", messageParsed)

    //peticion de creacion de usuario
    if(messageParsed.hasOwnProperty("createUserData")){      
      userName = messageParsed.createUserData.publicKey 
      nickName = messageParsed.createUserData.nickName

      if(users.hasOwnProperty(userName)){
        ws.send("usuario existente, cerrando conexion...")        
        ws.close()
      }
      else{
        messageParsed.createUserData.connection = ws
        const {publicKey, ...rest} = messageParsed.createUserData
        users[userName] = rest

        ws.send(JSON.stringify({"userCreated": {"userName": messageParsed.createUserData.publicKey, "nickName": messageParsed.createUserData.nickName}}))        
        console.log("users actualizado: ", users)
      }
    } 
        
    
    if(messageParsed.hasOwnProperty("tryPairing")){      
      const user2 = messageParsed.tryPairing.publicKeyUser2      

      if(userName === user2){
        const requestMessage = JSON.stringify({"error": "errorUserIsTheSame"})
        users[userName] !== undefined && users[userName].connection.send(requestMessage)   
      }
      
      // else if(!users.hasOwnProperty(user2)){        
      //   const requestMessage = JSON.stringify({"error": "errorUserDoesntExistOrReject"})        
        
      //   const timeOut = setTimeout(()=>{
      //     users[userName] !== undefined && users[userName].connection.send(requestMessage)
      //     clearTimeout(timeOut)
      //   },30000)        
      // }
      
      else if(users.hasOwnProperty(user2)){           
        const requestMessage = JSON.stringify({"requestConnection": {"userName": userName, "nickName": nickName}})
        users[userName].requestStatus = "requestSent"
        users[user2].requestStatus    = "requestReceived"
        users[userName].to            = user2
        users[user2].to               = userName


        users[user2].connection.send(requestMessage) 
        console.log("solicitud enviada", users)        
      }          
    }    
    

    if(messageParsed.hasOwnProperty("cancelRequestSent")){       
      const user1 = messageParsed.cancelRequestSent.user1
      const user2 = messageParsed.cancelRequestSent.user2

      console.log(user1, user2)
      users[user1].requestStatus = null
      users[user1].to = null
      
      if(users[user2]?.requestStatus !== undefined){
        users[user2].requestStatus = null
        users[user2].to = null
        users[user2].connection.send(JSON.stringify({"error":"canceledRequest"}))
      } 
      
      console.log("solicitud cancelada", users[user1]?.requestStatus, users[user2]?.requestStatus)  
    }

    if(messageParsed.hasOwnProperty("confirmedRequest")){

      //Aca agrega que se ejecute el codigo si el otro tiene requestStatus "requestSent"           
      const user1 = messageParsed.confirmedRequest.user1
      const user2 = messageParsed.confirmedRequest.user2
      
      if(users[user1] !== undefined){
        
        if(users[user1].requestStatus === "requestSent" && users[user2].requestStatus === "requestReceived"){
          users[user1].requestStatus = "chating"
          users[user2].requestStatus = "chating"             
          
          users[user1].to = user2
          users[user2].to = user1         
          
          const requestMessageUser1 = JSON.stringify({"chatConfirmed": {"to": user2, "toNickName": users[user2].nickName}})
          const requestMessageUser2 = JSON.stringify({"chatConfirmed": {"to": user1, "toNickName": users[user1].nickName}})
          users[user1].connection.send(requestMessageUser1) 
          users[user2].connection.send(requestMessageUser2) 
          
          console.log("solicitud confirmada", users[user1]?.requestStatus, users[user2]?.requestStatus)   
        }      
      }        
    }

    if(messageParsed.hasOwnProperty("rejectedRequest")){
      const user1 = messageParsed.rejectedRequest.user1
      const user2 = messageParsed.rejectedRequest.user2
      
      users[user2].requestStatus = null   
      users[user2].to = null  
      
      if(users[user1] !== undefined){
        users[user1].requestStatus = null
        users[user1].to = null  
        const requestMessageUser = JSON.stringify({"error": "errorUserDoesntExistOrReject"})
        users[user1].connection.send(requestMessageUser) 
      }          

      console.log("solicitud rechazada", users[user1]?.requestStatus, users[user2]?.requestStatus) 
    }

 
    if(messageParsed.hasOwnProperty("sendMessage")){
      const {from, to, message} = messageParsed.sendMessage      
      const messageToSend = JSON.stringify({"sentMessaje": {"from": from, "to": to, "message": message} })
      users[to].connection.send(messageToSend)        
    }
       
  });

  // Evento que se dispara cuando se cierra la conexión WebSocket
  ws.on('close', function close(e) {   

    const userDisconnected = users[userName]    
    delete users[userName]    

    if(userDisconnected.requestStatus === "requestReceived"){      
      if(users[userDisconnected.to] !== undefined){
          users[userDisconnected.to].to = null 
          users[userDisconnected.to].requestStatus = null 
      }     
    }

    if(userDisconnected.requestStatus === "requestSent"){       
      if(users[userDisconnected.to] !== undefined){       
        users[userDisconnected.to].connection.send(JSON.stringify({"error":"canceledRequest"})) 
        users[userDisconnected.to].to = null
        users[userDisconnected.to].requestStatus = null 
      }       
    }

    if(userDisconnected.requestStatus === "chating"){
      if(users[userDisconnected.to] !== undefined){
        users[userDisconnected.to].connection.send(JSON.stringify({"closing": "otherUserHasClosed"}))  
        users[userDisconnected.to].to = null
        users[userDisconnected.to].requestStatus = null     
      }
    }   
  });

  ws.on('error', function error(e) {    
    console.log(e)
  });
});