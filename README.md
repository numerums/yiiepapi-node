# yiiepapi-node
Yiiep payment plateforme API for nodejs.

Yiiep est une plateforme de payement en ligne basée sur le mobile money. Cet API vous permet d'intégrer Yiiep  comme solution de payement dans votre projet nodejs. L'API génère un qrcode que votre client peut scanner avec [l'appication mobile Yiiep](https://play.google.com/store/apps/details?id=com.numerumservices.yiiep) pour initier le payement.

Visitez [www.yiiep.com](https://www.yiiep.com/) pour en savoir plus.

## Installation
1. Cloner / Télécharger et déconpresser le répertoire yiiepapi-php dans votre projet.
2. Installez les dépendances.

```bash

npm install

```

## Fonctions principales

### presetBill(billId, billAmount, $urrency)
Setup bill on Yiiep plateform


### unsetBill(billHash)
Cancel Bill on Yiiep


### checkBill(billHash)
Get bill state


### payLink(billhash, class = '')
Build Yiiep pay link for a bill - Use to redirect user to Yiiep web site


### function payQR(billhash, class = '')
Build Yiiep pay qr code image tag for a bill - Use to display qrcode on your website


### transfer(amount, currency, receiver)
Transfert money from an Yiiep account to an Yiiep account


## Obtenir un ID d'api pour votre site ou application
1. [Créer un compte](https://www.yiiep.com/login)
2. Enregistrez un site marchand
3. Récupérer et configurer l'ID et la clé d'API dans le fichier config


## Exemple Utilisation
Ci dessous un exemple d'utilisation de l'API. Une version fonctionnelle de cet exemple est disponible dans le dossier  [example](../../example).  Pour plus d'information veuillez consulter la documentation.

```javascript
const YiiepApi = require('yiiepapi-node');

// 0 - Obtenir un ID/KEY (https://www.yiiep.com/login) 
var apiId = '4f06bba52a4bb09515b825fb1ef0709b'; //test Id
var apiKey = '926abbf15fe74c8d06b963710f71371ab43a17bc'; //test key

// 1 - Créer la facture
var billId = 'FACT0000001';
var billValue = 200;
var currency = 'XOF';
/*Supported Currencies
XAF	=> CFA CEMAC
XOF	=> CFA UEMOA
NGN	=> Nigerian Naira
GHS	=> Ghana Cedis
*/

// 2 - Sauvegarder la facture dans la base locale
/* 
	Do database stuffs here
*/

// 3 - Créer l'objet YiiepApi
var yiiepApi = new YiiepApi(apiId, apiKey, 'test'); //Change to 'real' for production

// 4 - Déclarer la facture
yiiepApi.presetBill(billId, billValue, currency).then((presetData) => {

    // 6 - Récupérer l'ID de payement Yiiep de votre facture
    var billHash = presetData.billhash;

    // 7' - Créer le lien de payement 
    var payLink = yiiepApi.payLink(billHash, 'btn btn-lg btn-primary');

    // 7'' - Créer le QR code de payement
	var payQR = yiiepApi.payQR(billHash, 'img-thumbnail');

    // 8 Do html/view stuffs here

}).catch(err => {
    console.log('Preset Error occure -->> ', err);
});

// 9 - check bill state - assuming user do payment
yiiepApi.checkBill(billHash).then((stateData) => {
    console.log('Bill state success -->> ', stateData);

    if(stateData.state === 'Paid'){
        //10  - Bill is paid, handle user order validation...
    }else{
        //Bill is not paid
    }
}).catch(err => {
    console.log('Check State Error occure -->> ', err);
});

```

## Credits
[Request-Promise](https://github.com/request/request-promise#readme/)

[JWT](https://jwt.io/)

[Bluebird](http://bluebirdjs.com/docs/getting-started.html)
