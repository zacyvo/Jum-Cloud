const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const algoliasearch = require("algoliasearch");
var client = algoliasearch('PG6OUD1C7P', 'c008c6efce6d8bc1c21777e7b819eadc');
//v 0.0.3 13/10/2018

const nodemailer = require('nodemailer');
const db = admin.firestore();
const tokenDoc = db.collection("tokens")


exports.onLisenerCreateStorePromotionsAlgolia = functions.firestore.document("storePromotions/{storePromotionsId}").onWrite( (change, context) =>{ 
    if(change.after.exists){
     const storePromotion = change.after.data();
     storePromotion.objectID  = change.after.id;
     storePromotion.id = change.after.id;
     let storePromotionsAlgolia = client.initIndex('storePromotions');
     return storePromotionsAlgolia.saveObject(storePromotion);
    }
})


exports.sendEmailNewAccount = functions.firestore.document("accounts/{accountsId}").onCreate(  (event) => {
    let account = event.data()
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: "jobtodayproject@gmail.com", // generated ethereal user
            pass: "J123456789" // generated ethereal password
        }
    });
    let link = `https://jum.vn/r/${account.referId?account.referId:""}`
    let mailOptions = {
        from: "Jum.vn", // sender address
        to: `${account.email.trim()}`, // list of receivers
        subject:`Tạo tài khoản mới thành công`, // Subject line
        text: ``, // plain text body
        html: `
        <p>
            Xin chào ${account.fullName}! Thông tin tại khoản của bạn: <br/>
            Email đăng nhập: ${account.email} <br/>
            Mật khẩu: ${account.password}<br/>
            Đường dẫn đăng nhập: <a href="${link}" style="color:blue">${link}</a>
        </p>` // html body
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log("Gui mail loi",error);
        }
    })

})

exports.sendNotifications = functions.firestore.document("notifications/{notificationId}").onCreate(  (event) => {
      // Exit if data already created
        let notifications = event.data();
        let ref =  tokenDoc;
        if(notifications.type===2){
            ref = ref.where("type", "==",1).where("type", "==",2)
        }
        else if (notifications.type===3){
            ref = ref.where("type", "==",3)
        }
        ref.get().then(snapToken=>{
            let tokens =[];
           snapToken.forEach( token => {
               const valueToken = token.data();
               tokens.push(valueToken.token);
           })
           const payload = {
               notification: {
               title: `${notifications.tittle}`,
               body: `${notifications.content}`,
               icon: 'https://firebasestorage.googleapis.com/v0/b/jober-v2.appspot.com/o/jum-favcon.jpg?alt=media&token=4f435209-d68e-4127-a19c-ccd69be845da'
               },
               data: {
                tittle: notifications.tittle,
                body:notifications.content,
                link:notifications.link
              }
           }
           const options = {
               priority: 'high',
               content_available: true
           };
           console.log("tokens",tokens);
        return admin.messaging().sendToDevice(tokens,payload,options);
        }).catch (err=>{
            console.log("Thong bao loi",err);
        })
    })
    


