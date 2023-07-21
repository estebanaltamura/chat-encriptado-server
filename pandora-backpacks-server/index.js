const express = require("express");
const mercadopago = require('mercadopago');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.post('/notifications', (req, res) => {
  console.log("------------------")
  console.log(req.body);
  
});

app.options('/createOrder', cors())

app.post('/createOrder', (req, res) => {
  res.status(200)
  console.log("body", req.body.items)

  const items = req.body.items
  const itemsHandled = items.map((item)=>({"id": Math.round(Math.random(),2), "title": item.name, "unit_price": item.price, "quantity": item.quantity, currency_id: "ARS", "picture_url": item.images[0]}))

  //console.log(itemsHandled)

  // Agrega credenciales
  mercadopago.configure({
    access_token: 'APP_USR-6329496204948801-071110-eb8bf56f043b2dea1ae0b8b8a3b04833-1421065886'
  });

  // Crea un objeto de preferencia
  let preference = { 
    "back_urls": {
      "success": "https://entrega-final-altamura.vercel.app/",
      "failure": "https://entrega-final-altamura.vercel.app/",
      "pending": "https://entrega-final-altamura.vercel.app/"
    },
    "auto_return": "approved",
    notification_url: "https://7ecc-2800-810-496-db9-fd1e-b52e-f613-65b6.ngrok-free.app/notifications",

    items: itemsHandled
  };

  mercadopago.preferences.create(preference)
    .then(function (response) {
      global.id = response.body.id;
      console.log(response.body.init_point);          
      res.send(JSON.stringify({"urlPayment":response.body.init_point}));
    })
    .catch(function (error) {
      console.log(error);
      res.sendStatus(500);
    });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

