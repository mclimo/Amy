var builder = require('botbuilder');
var restify = require('restify');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=================================================================
// Send welcome when conversation with bot is started, by initiating the root dialog
//=========================================================
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});

//=========================================================
// Delete Session UserData
//=========================================================

// Clears userData and privateConversationData, then ends the conversation
function deleteProfile(session) {
    session.userData = {};
    session.privateConversationData = {};
    session.endConversation("User profile deleted");
}

// Handle activities of type 'deleteUserData'
bot.on('deleteUserData', (message) => {
    // In order to delete any state, we need a session object, so start a dialog
    bot.beginDialog(message.address, 'deleteprofile');
});

// A dialog just for deleting state
bot.dialog('deleteprofile', function(session) {
    // Ok, now we have a session so we can delete the state
    deleteProfile(session);
});

// Creates a middleware to handle the /deleteprofile command
function deleteProfileMiddleware() {
    return {
        botbuilder: (session, next) => {
            if (/^deleteprofile$/i.test(session.message.text)) {
                deleteProfile(session);
            } else {
                next();
            }
        }
    };
}

// Install middleware
bot.use(deleteProfileMiddleware());

//=========================================================
// Bots Dialogs
//=========================================================

bot.beginDialogAction('height', '/getHeight')
bot.beginDialogAction('weight', '/getWeight')
bot.beginDialogAction('waist', '/getWaist')
bot.beginDialogAction('hips', '/getHips');
bot.beginDialogAction('skip', '/qThree');

//var intents = new builder.IntentDialog();
bot.dialog('/', [
    function (session, args, next) {
        if (!session.userData.name) {
            var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "https://www.axappphealthcare.co.uk/uploadedImages/Widget_Content_%28PB%29/Products/Corporate/Health_services/healthgateway-both.jpg"
            }]);
        session.send(msg);
            session.beginDialog('/getName');
        } else {
            var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "https://www.axappphealthcare.co.uk/uploadedImages/Widget_Content_%28PB%29/Products/Corporate/Health_services/healthgateway-both.jpg"
            }]);
        session.send(msg);
            next();
        }
    },
    function (session, results) {
        session.send("Hello " + session.userData.name + "!" +
                     " My name is Amy, welcome to the Health Age calculator. "+
                     "\nDiscovering your Health Age is a great way of finding out how healthy you are compared to your real age. ");
        builder.Prompts.confirm(session, "It will take you 5 to 10 minutes to complete the questionnaire. Are you ready to get started?",  { listStyle: builder.ListStyle.button });       
    },
    function (session, results) {
        if (results.response){
            session.beginDialog('/qOne');
        } else {
            session.endConversation("No problem, come back another time when you have more information to hand. I look forward to hearing from you soon.");
        }
    }
]);

// Get name and store it in UserData
bot.dialog('/getName', [
    function (session) {
        builder.Prompts.text(session, 'Hi! Let me start by asking your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 1 Gender
bot.dialog('/qOne', [
    function (session) {
        builder.Prompts.choice(session, "Lets find out about you! Are you a man or a woman?","Male|Female", { 
            listStyle: builder.ListStyle.button 
        });
    },
    function (session, results) {
        session.userData.gender = results.response.entity;
        session.replaceDialog('/qTwo');
    }
]);

// 2 Date of Birth
bot.dialog('/qTwo', [
    function (session) {
        builder.Prompts.text(session, 'And what is your date of birth? (e.g. 01/01/1970)');
    },
    function (session, results) {
        session.userData.dob = results.response;
        session.replaceDialog('/getHeight');
    }
]);

bot.dialog('/getHeight', [
    function (session) {
        builder.Prompts.number(session, 'What is your height in meters? If you\'re not sure, just enter what you think it is for now. (e.g. 1.76 m)');
    },
    function (session, results) {
        var i = aboutYouWorking.indexOf("height");
        aboutYouWorking.splice(i,1);
        session.userData.height = results.response;
        session.replaceDialog('/getWeight');
    }
]);
bot.dialog('/getWeight', [
    function (session) {
        builder.Prompts.number(session, 'What is your weight in Kilos? (e.g. 72.5 kg)');
    },
    function (session, results) {
        var i = aboutYouWorking.indexOf("weight");
        aboutYouWorking.splice(i,1);
        session.userData.weight = results.response;
        session.replaceDialog('/aboutYouCarousel');
    }
]);
bot.dialog('/getWaist', [
    function (session) {
        builder.Prompts.number(session, 'What is your waist measurement in centimeters? (e.g. 82 cm)');
    },
    function (session, results) {
        var i = aboutYouWorking.indexOf("waist");
        aboutYouWorking.splice(i,1);
        session.userData.waist = results.response;
        session.replaceDialog('/aboutYouCarousel');
    }
]);
bot.dialog('/getHips', [
    function (session) {
        builder.Prompts.number(session, 'What is your hip measurement in centimeters? (e.g. 84 cm)');
    },
    function (session, results) {
        var i = aboutYouWorking.indexOf("hips");
        aboutYouWorking.splice(i,1);
        session.userData.hips = results.response;
        session.replaceDialog('/aboutYouCarousel');
    }
]);

// 3 Family History of sudden illness
bot.dialog('/qThree', [
    function (session) {
        builder.Prompts.confirm(session, 'Lets talk about your family.'
        +'\nHave your mother, father, brother or sister ever have a heart attack, angina, or a stroke?', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        session.userData.familyhistoryattack = results.response;
        if (session.userData.familyhistoryattack) {
            session.send("I'm sorry to hear that. Would you mind filling out the information below to tell me a bit more?");
            familyCheck = false;
            session.beginDialog('/familyHistory');
        }
        else {
            session.send("OK that's great, I'll move on")
            session.beginDialog("/qFour");
        }
    }
]);

const family = ["father","mother","brother","sister", "I'm done"];
var familyMembers = family;
var who = "Which family member did this happen to?";
var whoElse = "Has this happened to any other members of your immediate family?";
var familyCheck = false;

// Method to gather at what age your immediate family had a major health event
bot.dialog('/familyHistory', [
    function (session) {
        if (familyCheck === false) {
        builder.Prompts.choice(session, who, familyMembers, {listStyle: builder.ListStyle.button});
        } else {
        builder.Prompts.choice(session, whoElse, familyMembers, {listStyle: builder.ListStyle.button});
        }
     },
    function (session, results) {
        var person = results.response.entity;
        switch (person) {
            case "father":
                familyCheck = true;
                var i = familyMembers.indexOf(person);
                familyMembers.splice(i,1);
                session.beginDialog("/attackage", person);  
                break;
            case "mother":
                familyCheck = true;
                var i = familyMembers.indexOf(person);
                familyMembers.splice(i,1);
                session.beginDialog("/attackage", person);
                break;
            case "brother":
                familyCheck = true;
                var i = familyMembers.indexOf(person);
                familyMembers.splice(i,1);
                session.beginDialog("/attackage", person);
                break;
            case "sister":
                familyCheck = true;
                var i = familyMembers.indexOf(person);
                familyMembers.splice(i,1);
                session.beginDialog("/attackage", person);
                break;
            case "I'm done":
                familyCheck = false;
                familyMembers = family;
                session.beginDialog("/qFour");
                break;
          }
     }
]);

// attack age dialog
bot.dialog("/attackage", [
    function (session, args) {
        builder.Prompts.number(session, "At what age did this happen to your "+args+"?");
    },
    function (session, results) {
        session.userData.familyhistoryattack.age = results.response;   
        session.replaceDialog("/familyHistory");
     }
]);

// 4 Blood Pressure
bot.dialog('/qFour', [
    function (session) {
        //session.send(session, "Please enter you Blood pressure level in ml/hg");
        builder.Prompts.choice(session, "Can you tell me what your blood pressure is? If you don't know, "
            + "you can ask your doctor and come back and update these anytime.", 
            "Enter your blood pressure|I don't know",
            { listStyle: builder.ListStyle.button});       
    },
    function (session, results) {
        switch (results.response.entity) {
            case "Enter your blood pressure":
                session.beginDialog('/bloodPressure');
                break;
            case "I don't know":
                session.beginDialog('/wasItHigh', "blood pressure");
                break;
        }
    },
    function (session, results) {
        session.beginDialog('/qFive');
    }
]);

bot.dialog('/bloodPressure', [
    function (session) {
        builder.Prompts.number(session, "Please enter your Systolic reading, this is the top number of your reading (mmHg)");
    },
    function (session, results) {
        session.userData.bloodpressuresystolic = results.response;
        builder.Prompts.number(session, "Please enter your Diastolic reading, this is the botton number of your reading (mmHg)");
    },
    function (session, results) {
        session.userData.bloodpressurediastolic = results.response;
        session.beginDialog('/qFive');
     }
]);

// 5 What is your cholesterol level?
bot.dialog('/qFive', [
    function (session) {
        session.send("Now let's look at you cholesterol level. This is made of 2 values: total cholesterol, and HDL.")
        builder.Prompts.choice(session, "First, what is your total cholesterol level in mg/dL or mmol/L", 
                            "Enter your total cholesterol level|I don't know",
                            { listStyle: builder.ListStyle.button}) ;
    },
    function (session, results) {
        switch (results.response.entity) {
            case "Enter your total cholesterol level":
                session.beginDialog('/cholesterol');
                break;
            case "I don't know":
                session.userData.cholesterolTotal = "Not known";
                session.userData.cholesterolHDL = "Not known";
                session.beginDialog('/wasItHigh', "cholesterol");
                break;
        }
    },
    function (session, results){
        session.beginDialog('/qSix');
    }
]);

// Was it high?
bot.dialog('/wasItHigh', [
    function (session, args) {
        //var highSubject = args;
        //console.log(highSubject);
        builder.Prompts.confirm(session, "Has your Doctor ever said your "+args+" was high?",{ listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        // FIX THAT THIS DOESNT WORK
        //console.log("high Subject %s", highSubject);
        //session.userData[highSubject].high = results.response;
        session.endDialog();
    }
]);

// Cholesterol collection dialog
bot.dialog('/cholesterol', [
    function (session) {
        builder.Prompts.number(session, "Please enter your total cholesterol mg/dL or mmol/L");
    },
    function (session, results) {
        session.userData.cholesterolTotal = results.response;
        builder.Prompts.number(session, "And what is your HDL cholesterol level in mg/dL or mmol/L?");
    },
    function (session, results) {
        session.userData.cholesterolHDL = results.response;
        session.replaceDialog('/qSix');
    }
]);

// 6 Do you smoke?
bot.dialog('/qSix', [
    function (session) {
        builder.Prompts.choice(session, 'How many cigarettes do you smoke per day?', 
                            "Enter number of cigarettes|I don't smoke", 
                            { listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        switch (results.response.entity) {
            case "Enter number of cigarettes":
                session.userData.smoker = "Yes";
                session.beginDialog('/smoker');
                break;
            case "I don't smoke":
                session.userData.smoker = "No";
                session.beginDialog('/results');
                break;
        }
    }
]);

bot.dialog('/smoker', [
    function (session) {
        builder.Prompts.number(session, "How many cigarettes do you smoke on average per day?");
    },
    function (session, results) {
        session.userData.smokerPerDay = results.response;
        session.replaceDialog('/results');
    }
]);

// Results dialog
bot.dialog('/results', [
    function (session) {
        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "https://dl.dropboxusercontent.com/content_link/EOsSabT9XBQoj2cuipbjNSK7MnDRzzlCl7YiyjZ9vLaocNCqENuvJnlzjXf78a5y/file?dl=0&duc_id=HsladKdKcqeYUCgpkt9xn3wmaF3Eb7v96lya796wkoCUwhe1Xc8ItobWY8NRukQr&raw=1&size=1280x960&size_mode=3"
            }]);
        session.send(msg);
        session.send("Thank you for taking the time to complete these questions! Your Health Age is 68 Yrs 2 Mo, and you can reduce this by 17 yrs and 2 Mo."
                    + "Have a look at your Health Age journey and progress at a glance.");
        builder.Prompts.choice(session, "Do you want to see your results in more detail and find out how to make the right changes to improve your Health Age?",
                "See my results|Update my Health Age|I'm done for today",
                { listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        switch (results.response.entity) {
            case "See my results":
                session.beginDialog('/resultsCarousel');
                break;
            case "Update my Health Age":
                session.beginDialog('/customerReceipt');
                break;
            case "I'm done for today":
                session.endConversation("Thank you for taking the time to complete your Health Age, come back with any updates to your information by just saying Hi");  
                break;
        }
    }
]);

const aboutYouMeasures = ["height", "weight", "waist", "hips"];
const aboutYouArray = {
    "height": {
        title: "How to Measure Your Height by Yourself",
        text: "1. Take off your shoes, socks, and any head accessories. "
                + "\n2. Stand with your back against the wall and your feet together. "
                + "\n3. Place a box on top of your head. Make sure it\'s touching the wall."
                + "\n4. Make a mark under the box with a pencil."
                + "\n5. Measure from the floor to the pencil mark with a measuring tape.",
        images: "http://pad3.whstatic.com/images/thumb/4/4f/Measure-Your-Height-by-Yourself-Step-5-Version-2.jpg/aid1624233-v4-728px-Measure-Your-Height-by-Yourself-Step-5-Version-2.jpg",
        buttons: {
            button1: {
                action: "height",
                title: "Enter your Height"
            }
        }
    },
    "weight": {
        title: "How to Measure Your Weight",
        text: "1. Get yourself a good body scale."
                + "\n2. Ideally weight yourself when naked."
                + "\n3. Try to weigh yourself at the same point each day, such as when you first wake up.",
        images: "https://i.kinja-img.com/gawker-media/image/upload/s--bkrleqh9--/c_scale,fl_progressive,q_80,w_800/18hzc2ov8x4w8jpg.jpg",
        buttons: {
            button1: {
                action: "weight",
                title: "Enter your weight"
            }
        }            
    },
    "waist": {
        title: "How to Measure Your Waist",
        text: "1. Remove your outer garments."
                + "\n2. Stand with your feet together."
                + "\n3. Wrap a soft measuring tape straight and snug around the narrowest part of your waist.",
        images: "http://www.diabetes.co.uk/images/article_images/measuring-waist.jpg",
        buttons: {
            button1: {
                action: "waist",
                title: "Enter your Waist Measurement"
            },
            button2: {
                action: "skip",
                title: "I'll complete this later"
            }
        }
    },
    "hips": {
        title: "How to Measure Your Hips",
        text: "To correctly measure your Hips:"
                + "\n1. Remove your outer garments."
                + "\n2. Stand with your feet together."
                + "\n3. Wrap a soft measuring tape straight and snug around the widest part of your hips.",
        images: "http://1.bp.blogspot.com/_Jp5PY2tunC0/TOtJ_3BejkI/AAAAAAAAADk/2-yHgQFCPic/s1600/hip.jpg",
        buttons: {
            button1: {
                action: "hips",
                title: "Enter your Hip Measurement"
            },
            button2: {
                action: "skip",
                title: "I'll complete this later"
            }
        }
    }
};
var aboutYouWorking = aboutYouMeasures;
var aboutYouCheck = false;
var aboutYouBasic1 = "Next I need to find your waist and hip measurement. But you can add this later if you want!";
var aboutYouBasic2 = "That's great, keep going.";

// Dialog that contains the constructor for the About You carousel
bot.dialog('/aboutYouCarousel', [
    function (session) {
        if (aboutYouWorking.length === 0){
            session.replaceDialog('/qThree');
        }
        if (!aboutYouCheck) {
            session.send(aboutYouBasic1)
        } else {
            session.send(aboutYouBasic2)
        }
        var cards = [];
        //var cards = getAboutYouCardsAttachments();
        for (i=0; i<aboutYouWorking.length;i++) {
                cards.push(getCard(session, aboutYouWorking[i]));
        }
        // bring the arrays up one level
        var cardsFinal = cards.concat(cards[0],cards[1],cards[2],cards[3]);        
        // remove the arrays at the start
        cardsFinal.splice(0,aboutYouWorking.length);
        // create reply with Carousel AttachmentLayout
        var reply = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(cardsFinal);
        session.send(reply);
    }
]);

function getCard (session, args) {
    aboutYouCheck = true;
    if (!aboutYouArray[args].buttons.button2){
        var buttons = [
            builder.CardAction.dialogAction(session, aboutYouArray[args].buttons.button1.action, null, aboutYouArray[args].buttons.button1.title)
        ]
    } else {
        var buttons = [
            builder.CardAction.dialogAction(session, aboutYouArray[args].buttons.button1.action, null, aboutYouArray[args].buttons.button1.title),
            builder.CardAction.dialogAction(session, aboutYouArray[args].buttons.button2.action, null, aboutYouArray[args].buttons.button2.title)
        ]
    }
    return [
        new builder.HeroCard(session)
            .title(aboutYouArray[args].title)
            .text(aboutYouArray[args].text)
            .images([
                builder.CardImage.create(session, aboutYouArray[args].images)
                ])
            .buttons(buttons)
    ]
}

// Dialog that contains the constructor for the Results carousel
bot.dialog('/resultsCarousel', [
    function (session) {   
        var cards = getCardsAttachments();

        // create reply with Carousel AttachmentLayout
        var reply = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(cards);
        session.send(reply);
        session.endConversation();
    }
]);

// method providing cards for the Results Carousel
function getCardsAttachments(session) {
    return [
        new builder.VideoCard(session)
            .title("How to start Running: Couch to 5k")
            .subtitle("More vigerous exercise will reduce your DHA by 2.5 years")
            .text("Just because you don’t run doesn’t mean you can’t. If you can walk for half an hour, chances are that you can pick up the pace and give running a try.")
            .image(builder.CardImage.create(session, "https://ichef.bbci.co.uk/images/ic/480xn/p03mn4lx.jpg"))
            .media([
                   { url: 'https://youtu.be/of0FZaSRk60?t=2s' }
            ])
            .buttons([
                   builder.CardAction.openUrl(session, "https://www.nhs.uk/oneyou/apps#row-179', 'One You Couch to 5k app"),
                   builder.CardAction.openUrl(session, "http://downloads.bbc.co.uk/scotland/makeyourmove/c25k_printable_plan.pdf", 'Download Plan as a document')
            ]),

        new builder.HeroCard(session)
            .title("How to Stop Smoking")
            .subtitle("Stopping Smoking will reduce your DHA by 1.5 years")
            .text("Find out practical, quick and simple steps you can take NOW to quit successfully. Download the NHS Smokefree app")
            .images([
                builder.CardImage.create(session, "http://www.deanspharmacy.co.uk/kilmarnock/services/stop-smoking-clinics/nhs-prescriptions.jpg")
            ])
            .buttons([
                builder.CardAction.openUrl(session, "http://nhs.uk/oneyou/sfreei", "iTunes"),
                builder.CardAction.openUrl(session, "http://nhs.uk/oneyou/sfreea", "Google Play")
            ]),

        new builder.AnimationCard(session)
            .title("Diet Tips: How to cut down on Sugar in your diet")
            .subtitle("Reducing your sugar intake will reduce your DHA by 0.5 years")
            .text("From the age of 11 we should have no more than 30g of added sugars (about 7 sugar cubes) in our diet every day.")
            .image(builder.CardImage.create(session, "https://photos-6.dropbox.com/t/2/AABBhS94DJ1nJgzThLIJ9i5P7jHYHLz9TzQZm0CS5lO6Cw/12/315907919/png/32x32/1/_/1/2/Sugar.png/EPyl47cCGCkgBygH/5tPzPqo2CUJdvFKF1TNsDM4Zwz3s4vGd3q-xS_FoKmg?size=1280x960&size_mode=3"))
            .media([
               { url: "https://dl.dropboxusercontent.com/content_link/EOsSabT9XBQoj2cuipbjNSK7MnDRzzlCl7YiyjZ9vLaocNCqENuvJnlzjXf78a5y/file?dl=0&duc_id=HsladKdKcqeYUCgpkt9xn3wmaF3Eb7v96lya796wkoCUwhe1Xc8ItobWY8NRukQr&raw=1&size=1280x960&size_mode=3" }
            ])
            .buttons([
                builder.CardAction.openUrl(session, "http://www.nhs.uk/Livewell/Goodfood/Pages/how-to-cut-down-on-sugar-in-your-diet.aspx", "10 Practical Tips")
            ])
    ];
}

// Customer Data Receipt, ultimately for review and editing
bot.dialog('/customerReceipt', [
    function (session) {
        session.send("Here is a quick overview of the data you've entered");
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("%s\'s Health Data", session.userData.name)
                    .items([
                        //builder.ReceiptItem.create(session, session.userData.gender, "Gender").image(builder.CardImage.create(session, "")),
                        //builder.ReceiptItem.create(session, "21.07.82", "Date of Birth").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.height +" m", "Height").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.weight +" kg", "Weight").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.waist +" cm", "Waist Measurement").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.hips +" cm", "Hip Measurement").image(builder.CardImage.create(session, "")),                        
                        builder.ReceiptItem.create(session, session.userData.bloodpressuresystolic + " / " + session.userData.bloodpressurediastolic + " mmHg", "Blood Pressure").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "5.6 mmol\\L", "Fasting Glucose").image(builder.CardImage.create(session, "")),                       
                        builder.ReceiptItem.create(session, session.userData.cholesterol + " mmol\\L", "Cholesterol").image(builder.CardImage.create(session, "")),
                        //builder.ReceiptItem.create(session, "No", "Diabetic").image(builder.CardImage.create(session, "")),
                        //builder.ReceiptItem.create(session, "Yes", "Smoker").image(builder.CardImage.create(session, ""))                       
                    ])
            ]);
        session.send(msg);
        builder.Prompts.choice(session, "How about looking at your health and wellbeing tips to improve these numbers?",
            "Show Me My Tips|I'm out of time",
                { listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        switch (results.response.entity) {
            case "Show Me My Tips":
                session.beginDialog('/resultsCarousel');
                break;
            case "I'm out of time":
                session.endConversation("Thanks for taking the time to complete your DHA, come back with any updates to your information by just saying Hi");  
                break;
        }
    }
]);

//======================================================================================
// REFERENCE DIALOGS
//======================================================================================
/*
bot.dialog('/getDOB', [
    function (session) {
        builder.Prompts.time(session, 'Hi! What is your Date of Birth? e.g. 01/01/1972');
    },
    function (session, results) {
        session.userData.dob = results.response;
        session.endDialog("Wow, you were born "+ session.userData.dob + " but you look so young!");
    }
]);


// 7 Tell us the frequency, duration and intensity of your weekly activity
// Need to work out how to phrase this
bot.dialog('/qSeven', [
    function (session) {
        builder.Prompts.text(session, 'Tell us the frequency, duration and intensity of your weekly activity');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 8 Stress
bot.dialog('/qEigth', [
    function (session) {
        builder.Prompts.text(session, 'On a scale of 1 - 10 how much stress do you currently experience?\n\n0 = no stress 10 = a lot of stress');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// What is your fasting blood glucose
bot.dialog('/qNine', [
    function (session) {
        builder.Prompts.text(session, 'What is your fasting blood glucose');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 10 Are you Diabetic
bot.dialog('/qTen', [
    function (session) {
        builder.Prompts.text(session, 'Are you Diabetic');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 11 Do you Drink Alcohol
bot.dialog('/qEleven', [
    function (session) {
        builder.Prompts.text(session, 'Do you drink alcohol?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 12 Servings of Fruit or Veg
bot.dialog('/qTwelve', [
    function (session) {
        builder.Prompts.text(session, 'Do you consume five or more servings of fruit or veg per day? if it helps a chopped handful of fruit or veg is a single serving.');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 13 Lack of sleep
bot.dialog('/qThirteen', [
    function (session) {
        builder.Prompts.text(session, 'Would you say you regularly feel tired from lack of sleep?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 14 Immediate Family Cancer
bot.dialog('/qFourteen', [
    function (session) {
        builder.Prompts.text(session, 'Have any of your immediate family (Father, Mother, Brother or Sister) been diagnosed with any of the following cancers?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 15 Muscle, Joint or Arthritis
bot.dialog('/qFifteen', [
    function (session) {
        builder.Prompts.text(session, 'Do you suffer from joint or muscle pain, or any type of arthritis');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 16 Last Question, pairs of statements
bot.dialog('/qSixteen', [
    function (session) {
        builder.Prompts.choice(session, "One last question! Can you choose one of the following pairs of statements that you most agree with and that most reflects the kind of person you are?", 
                'Yes|No|Show Me',  
                { listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        session.userData.qSixteen = results.response;
        session.beginDialog('/results');
    }
]);
*/
/*
// Picture Card Setup Sample
bot.dialog('/picture', [
    function (session) {
        session.send("Measure the widest point around the hips");
        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "https://www.axappphealthcare.co.uk/uploadedImages/Widget_Content_%28PB%29/Products/Corporate/Health_services/healthgateway-both.jpg"
            }]);
        session.endDialog(msg);
    }
]);

// HeroCard setup Sample 2
bot.dialog('/waistCard', [
    function (session) {
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("How to measure your waist")
                    .text("Measure just above the belly button")
                    .images([
                        builder.CardImage.create(session, "http://www.diabetes.co.uk/images/article_images/measuring-waist.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "http://www.diabetes.co.uk/images/article_images/measuring-waist.jpg"))
            ]);
        session.endDialog(msg);
    }
]);

// could be used to output the customer's numbers to see if they have inputted their details correctly
bot.dialog('/receipt', [
    function (session) {
        session.send("You can send a receipts for facebook using Bot Builders ReceiptCard...");
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$22.00", "EMP Museum").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/a/a0/Night_Exterior_EMP.jpg")),
                        builder.ReceiptItem.create(session, "$22.00", "Space Needle").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/7/7c/Seattlenighttimequeenanne.jpg"))
                        //builder.ReceiptItem.create(session, session.userData.name, "Name").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/7/7c/Seattlenighttimequeenanne.jpg"))
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method")
                    ])
                    .tax("$4.40")
                    .total("$48.40")
            ]);
        session.endDialog(msg);
    }
]);

// Customer Data Receipt, for review and editing
bot.dialog('/dataReceipt', [
    function (session) {
        session.send("Here is a quick overview of the data you've entered");
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("%s\'s Health Data")
                    .items([
                        //builder.ReceiptItem.create(session, "$22.00", "EMP Museum").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/a/a0/Night_Exterior_EMP.jpg")),
                        //builder.ReceiptItem.create(session, "$22.00", "Space Needle").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/7/7c/Seattlenighttimequeenanne.jpg"))
                        builder.ReceiptItem.create(session, session.userData.name, "Your name").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "21.07.82", "Date of Birth").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "120 / 80 mmHg", "Blood Pressure").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "3.8 mmol\\L", "Fasting colesterol").image(builder.CardImage.create(session, "")),                       
                        builder.ReceiptItem.create(session, "1.78 m", "Height").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "72 kg", "Weight").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "82 cm", "Waist Measurement").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "92 cm", "Hip Measurement").image(builder.CardImage.create(session, ""))
                    ])
            ]);
        session.endDialog(msg);
    }
]);

// GIF animation card, autoplay example
bot.dialog('/animationCard', [
    function (session) {
        var msg = new builder.Message(session)
            .attachments ([
                new builder.AnimationCard(session)
                    .title('Microsoft Bot Framework')
                    .subtitle('Animation Card')
                    .image(builder.CardImage.create(session, 'https://docs.botframework.com/en-us/images/faq-overview/botframework_overview_july.png'))
                    .media([
                        { url: 'http://i.giphy.com/Ki55RUbOV5njy.gif' }
                    ])
            ]);
        session.endDialog(msg);
    }
]);

// Example Video card
bot.dialog('/testvideoCard', [
    function (session) {
        var msg = new builder.Message(session)
            .attachments ([
                new builder.VideoCard(session)
                    .title('Big Buck Bunny')
                    .subtitle('by the Blender Institute')
                    .text('Big Buck Bunny (code-named Peach) is a short computer-animated comedy film by the Blender Institute, part of the Blender Foundation. Like the foundation\'s previous film Elephants Dream, the film was made using Blender, a free software application for animation made by the same foundation. It was released as an open-source film under Creative Commons License Attribution 3.0.')
                    .image(builder.CardImage.create(session, 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/220px-Big_buck_bunny_poster_big.jpg'))
                    .media([
                        { url: 'http://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4' }
                    ])
                    .buttons([
                    builder.CardAction.openUrl(session, 'https://peach.blender.org/', 'Learn More')
                    ])
            ]);
        session.endDialog(msg);
    }
]);
*/