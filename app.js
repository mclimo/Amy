var builder = require('botbuilder');
var restify = require('restify');
//var Choices = require('prompt-choices');

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
    //appId: process.env.MICROSOFT_APP_ID,
    //appPassword: process.env.MICROSOFT_APP_PASSWORD
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
        //var msg = new builder.Message(session)
        //    .attachments([{
        //        contentType: "image/jpeg",
        //        contentUrl: "https://www.axappphealthcare.co.uk/uploadedImages/Widget_Content_%28PB%29/Products/Corporate/Health_services/healthgateway-both.jpg"
        //    }]);
        //session.send(msg);
        session.send("Hello " + session.userData.name + 
                     " my name is Amy, welcome to the Health Age calculator from AXA PPP Proactive Health. " +
                     "\n\nA couple of things before we get started, it will take us about 10 minutes to complete the calculation.");
        builder.Prompts.confirm(session, "We are also going to ask some personal information about your health, is that OK?",  { listStyle: builder.ListStyle.button });       
    },
    function (session, results) {
        if (results.response) {
            session.send("That's great, to get the best calculation we're going to need the following information:"
                    + "\n\n - Height and Weight             (e.g. 1.78 m)"
                    + "\n\n - Waist and Hip measurements    (e.g. 82 cm)"
                    + "\n\n - Blood pressure                (e.g. 120/80 mmHg)"
                    + "\n\n - Cholesterol level             (e.g. 3.8 mmol/L)"
                    + "\n\n - Fasting blood glucose level   (e.g. 5.6 mmol/L)"
                    + "\n\n - and some medical history of your immediate family members.");
            builder.Prompts.confirm(session,"If you are missing any of this information, we can omit it for now and you can add it later."
                    + "\n\n Would you like to continue to estimate your health age now?", { listStyle: builder.ListStyle.button });
        } else {
            session.endConversation("No problem, please come and talk to me again another time");
        }    
    },
    function (session, results) {
        if (results.response){
            session.send("That's great, lets get started");
            session.beginDialog('/qOne');
        } else {
            session.endConversation("No problem, come back another time when you have more information to hand. I look forward to hearing from you soon.");
        }
    }
]);

// Get name and store it in UserData
bot.dialog('/getName', [
    function (session) {
        builder.Prompts.text(session, 'ZERO - Hi! Let me start by asking your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

// 1 Gender
bot.dialog('/qOne', [
    function (session) {
        builder.Prompts.choice(session, "Q.ONE - First we need some basic information about you, \n\nWhat is your gender?","Male|Female", { 
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
        builder.Prompts.text(session, 'Q.TWO - What is your date of birth? (e.g. 01/01/1970)');
    },
    function (session, results) {
        session.userData.dob = results.response;
        session.replaceDialog('/aboutYouCarousel');
    }
]);

//const aboutYou = ["Height","Weight","Waist","Hips"];
//var aboutYouNotComplete = aboutYou;

bot.dialog('/getHeight', [
    function (session) {
        builder.Prompts.number(session, 'Q.THREE.A - What is your Height in meters? (e.g. 1.76 m)');
    },
    function (session, results) {
        session.userData.height = results.response;
        session.replaceDialog('/aboutYouCarousel');
    }
]);
bot.dialog('/getWeight', [
    function (session) {
        builder.Prompts.number(session, 'Q.THREE.B - What is your Weight in Kilos? (e.g. 72.5 kg)');
    },
    function (session, results) {
        session.userData.weight = results.response;
        session.replaceDialog('/aboutYouCarousel');
    }
]);
bot.dialog('/getWaist', [
    function (session) {
        builder.Prompts.number(session, 'Q.THREE.C - What is your Waist measurement in centimeters? (e.g. 82 cm)');
    },
    function (session, results) {
        session.userData.waist = results.response;
        session.replaceDialog('/aboutYouCarousel');
    }
]);
bot.dialog('/getHips', [
    function (session) {
        builder.Prompts.number(session, 'Q.THREE.D - What is your Hip measurement in centimeters? (e.g. 84 cm)');
    },
    function (session, results) {
        session.userData.hips = results.response;
        session.replaceDialog('/aboutYouCarousel');
    }
]);

// 3 Family History of sudden illness
bot.dialog('/qThree', [
    function (session) {
        builder.Prompts.confirm(session, 'Q.FOUR - Now some medical history of your immediate family'
        +'\n\nPlease indicate if your Father, Mother, Brother or Sister have ever had:'
        +'\n\n- Angina' 
        +'\n\n- a Heart Attack, or'
        +'\n\n- a Stroke.', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        session.userData.familyhistoryattack = results.response;
        if (session.userData.familyhistoryattack) {
            session.send("I am very sorry to hear that. I need to ask some more questions");
            familyCheck = false;
            session.beginDialog('/familyHistory');
        }
        else {
            session.send("OK that's great, I'll move on")
            session.beginDialog("/qFour");
        }
    }
]);

const family = ["Father","Mother","Brother","Sister", "I'm done"];
var familyMembers = family;
var who = "Q.FOUR.A - Who did this happen to?";
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
            case "Father":
                familyCheck = true;
                var i = familyMembers.indexOf(person);
                familyMembers.splice(i,1);
                session.beginDialog("/attackage", person);  
                break;
            case "Mother":
                familyCheck = true;
                var i = familyMembers.indexOf(person);
                session.send("Person is: "+person+" \n\nIndex of Person is: "+i);
                familyMembers.splice(i,1);
                session.beginDialog("/attackage", person);
                break;
            case "Brother":
                familyCheck = true;
                var i = familyMembers.indexOf(person);
                familyMembers.splice(i,1);
                session.beginDialog("/attackage", person);
                break;
            case "Sister":
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

bot.dialog("/attackage", [
    function (session, args) {
        //attack age
        builder.Prompts.number(session, "Q.FOUR.C - At what age did this happen to your "+args+"?");
    },
    function (session, results) {
        session.userData.familyhistoryattack.age = results.response;   
        session.replaceDialog("/familyHistory");
        //bot.end
     }
]);

// 4 Blood Pressure
bot.dialog('/qFour', [
    function (session) {
        //session.send(session, "Please enter you Blood pressure level in ml/hg");
        session.send("Q.FIVE - Getting there now."
        + "\n\nNext I need to know your Blood pressure readings.");
        builder.Prompts.number(session, 'Q.FIVE.A - Please enter your Systolic reading, this is the top number of your reading \n\n (mmHg)');
    },

    function (session, results) {
        session.userData.bloodpressuresystolic = results.response;
        builder.Prompts.number(session, 'Q.FIVE.B - Please enter your Diastolic reading, this is the botton number of your reading \n\n (mmHg)');
    },

    function (session, results) {
        session.userData.bloodpressurediastolic = results.response;
        session.beginDialog('/qFive');
     }
]);

// 5 What is your cholesterol level?
bot.dialog('/qFive', [
    function (session) {
        builder.Prompts.number(session, 'Q.SIX - Please enter you level of Cholesterol \n\n(mmol/L)');
    },
    function (session, results) {
        session.userData.cholesterol = results.response;
        session.beginDialog('/qSix');
    }
]);

// 6 Do you smoke?
bot.dialog('/qSix', [
    function (session) {
        builder.Prompts.confirm(session, 'Q.SEVEN - Do you smoke?', {listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        session.userData.smoker = results.response.entity;
        session.beginDialog('/results');
    }
]);



bot.dialog('/results', [
    function (session) {
        session.send("Q.RESULTS - Thank you for taking the time to complete these questions, our calculations show that you're Dynamic Health Age (DHA) is 39.5 years. "
        + "\n\nFor a 34 year old this is __5.5 years too high__. "); 
        builder.Prompts.choice(session, "Q.NEXTSTEPS - Do you have time to look at some suggestions for improving your score in some key areas?",
                "Show Me|My Health Data|I'm out of time",
                { listStyle: builder.ListStyle.button});
    },
    function (session, results) {
        switch (results.response.entity) {
            case "Show Me":
                session.beginDialog('/resultsCarousel');
                break;
            case "My Health Data":
                session.beginDialog('/customerReceipt');
                break;
            case "I'm out of time":
                session.endConversation("Thanks for taking the time to complete your DHA, come back with any updates to your information by just saying Hi");  
                break;
        }
    }
]);

// Dialog that contains the constructor for the About You carousel
bot.dialog('/aboutYouCarousel', [
    function (session) {
        session.send("Q.THREE - Next some of your basic body measurements, please complete all of these.")
        var cards = getAboutYouCardsAttachments();
        
        // create reply with Carousel AttachmentLayout
        var reply = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(cards);
        session.send(reply);
        //session.beginDialog('height');
        //session.endDialog();
    },
    function (session, results) {
        session.send('I made it to the response')
        session.beginDialog(results.response.entity);
    }
]);

// Dialog that contains the constructor for the Results carousel
bot.dialog('/resultsCarousel', [
    function (session) {   
        var cards = getCardsAttachments2();

        // create reply with Carousel AttachmentLayout
        var reply = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(cards);
        session.send(reply);
        session.endConversation();
    }
]);

// method providing cards for the About You Carousel
function getAboutYouCardsAttachments(session) {
    return [
        new builder.HeroCard(session)
            .title('How to Measure Your Height by Yourself')
            //.subtitle('')
            .text('1. Take off your shoes, socks, and any head accessories. '
                + '2. Stand with your back against the wall and your feet together. '
                + '3. Place a box on top of your head. Make sure it\'s touching the wall.'
                + '4. Make a mark under the box with a pencil.'
                + '5. Measure from the floor to the pencil mark with a measuring tape.')
            .images([
                builder.CardImage.create(session, 'http://pad3.whstatic.com/images/thumb/4/4f/Measure-Your-Height-by-Yourself-Step-5-Version-2.jpg/aid1624233-v4-728px-Measure-Your-Height-by-Yourself-Step-5-Version-2.jpg')
            ])
            //.tap(builder.CardAction.openUrl(session, 'http://pad3.whstatic.com/images/thumb/4/4f/Measure-Your-Height-by-Yourself-Step-5-Version-2.jpg/aid1624233-v4-728px-Measure-Your-Height-by-Yourself-Step-5-Version-2.jpg'))
            .buttons([
                builder.CardAction.dialogAction(session, 'height', null, "Enter your Height"),
                builder.CardAction.dialogAction(session, 'skip', null, "I'll complete this later")
            ]),

        new builder.HeroCard(session)
            .title('How to Measure Your Weight')
            //.subtitle('')
            .text('1. Get yourself a good body scale.'
                + '2. Ideally weight yourself when naked.'
                + '3. Try to weigh yourself at the same point each day, such as when you first wake up.')
            .images([
                builder.CardImage.create(session, 'https://i.kinja-img.com/gawker-media/image/upload/s--bkrleqh9--/c_scale,fl_progressive,q_80,w_800/18hzc2ov8x4w8jpg.jpg')
            ])
            //.tap(builder.CardAction.openUrl(session, 'https://i.kinja-img.com/gawker-media/image/upload/s--bkrleqh9--/c_scale,fl_progressive,q_80,w_800/18hzc2ov8x4w8jpg.jpg'))            
            .buttons([
                builder.CardAction.dialogAction(session, 'weight', null, 'Enter your Weight'),
                builder.CardAction.dialogAction(session, 'skip', null, "I'll complete this later")
            ]),

       new builder.HeroCard(session)
            .title('How to Measure Your Waist')
            //.subtitle('')
            .text("1. Remove your outer garments."
                + "2. Stand with your feet together."
                + "3. Wrap a soft measuring tape straight and snug around the narrowest part of your waist.")
            .images([
                builder.CardImage.create(session, 'http://www.diabetes.co.uk/images/article_images/measuring-waist.jpg')
            ])
            //.tap(builder.CardAction.openUrl(session, 'http://www.diabetes.co.uk/images/article_images/measuring-waist.jpg'))            
            .buttons([
                builder.CardAction.dialogAction(session, 'waist', null, 'Enter your Waist Measurement'),
                builder.CardAction.dialogAction(session, 'skip', null, "I'll complete this later")
            ]),
       
       new builder.HeroCard(session)
            .title('How to Measure Your Hips')
            //.subtitle('')
            .text('To correctly measure your Hips:'
                + '1. Remove your outer garments.'
                + '2. Stand with your feet together.'
                + '3. Wrap a soft measuring tape straight and snug around the widest part of your hips.')
            .images([
                builder.CardImage.create(session, 'http://1.bp.blogspot.com/_Jp5PY2tunC0/TOtJ_3BejkI/AAAAAAAAADk/2-yHgQFCPic/s1600/hip.jpg')
            ])
            //.tap(builder.CardAction.openUrl(session, 'http://1.bp.blogspot.com/_Jp5PY2tunC0/TOtJ_3BejkI/AAAAAAAAADk/2-yHgQFCPic/s1600/hip.jpg'))            
            .buttons([
                builder.CardAction.dialogAction(session, 'hips', null, 'Enter your Hip Measurement'),
                builder.CardAction.dialogAction(session, 'skip', null, "I'll complete this later")
            ])
    ];
}

// method providing cards for the Results Carousel
function getCardsAttachments2(session) {
    return [
        new builder.VideoCard(session)
            .title('How to start Running: Couch to 5k')
            .subtitle('More vigerous exercise will reduce your DHA by 2.5 years')
            .text('Just because you don’t run doesn’t mean you can’t. If you can walk for half an hour, chances are that you can pick up the pace and give running or jogging a try. '
            +'\n\nBBC Get Inspired has teamed up with Public Health England’s One You campaign to bring you the Couch to 5K programme. '
            +'It has been especially designed for people who have done little or no running. ')
            .image(builder.CardImage.create(session, 'https://ichef.bbci.co.uk/images/ic/480xn/p03mn4lx.jpg'))
            .media([
                   { url: 'https://youtu.be/of0FZaSRk60?t=2s' }
            ])
            .buttons([
                   builder.CardAction.openUrl(session, 'https://www.nhs.uk/oneyou/apps#row-179', 'One You Couch to 5k app'),
                   builder.CardAction.openUrl(session, 'http://downloads.bbc.co.uk/scotland/makeyourmove/c25k_printable_plan.pdf', 'Download Plan as a document')
            ]),

        new builder.HeroCard(session)
            .title('How to Stop Smoking')
            .subtitle('Stopping Smoking will reduce your DHA by 1.5 years')
            .text('Find out practical, quick and simple steps you can take NOW to quit successfully. Download the NHS Smokefree app')
            .images([
                builder.CardImage.create(session, 'http://www.deanspharmacy.co.uk/kilmarnock/services/stop-smoking-clinics/nhs-prescriptions.jpg')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'http://nhs.uk/oneyou/sfreei', 'iTunes'),
                builder.CardAction.openUrl(session, 'http://nhs.uk/oneyou/sfreea', 'Google Play')
            ]),

        new builder.AnimationCard(session)
            .title('Diet Tips: How to cut down on Sugar in your diet')
            .subtitle('Reducing your sugar intake will reduce your DHA by 0.5 years')
            .text('From the age of 11 we should have no more than 30g of added sugars (about 7 sugar cubes) in our diet every day.'
            + '\n\n Practical tips to help you reduce the amount of sugar you eat throughout the day.')
            .media([
               { url: 'http://www.nhs.uk/Livewell/Goodfood/PublishingImages/Sugar-gif-final-nowords_A.gif' }
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'http://www.nhs.uk/Livewell/Goodfood/Pages/how-to-cut-down-on-sugar-in-your-diet.aspx', '10 Practical Tips')
            ])
    ];
}

// Customer Data Receipt, ultimately for review and editing
bot.dialog('/customerReceipt', [
    function (session) {
        session.send("Q.RESULTS.RECEIPT - Here is a quick overview of the data you've entered");
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("%s\'s Health Data", session.userData.name)
                    .items([
                        builder.ReceiptItem.create(session, session.userData.gender, "Gender").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "21.07.82", "Date of Birth").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.height +" m", "Height").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.weight +" kg", "Weight").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.waist +" cm", "Waist Measurement").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.hips +" cm", "Hip Measurement").image(builder.CardImage.create(session, "")),                        
                        builder.ReceiptItem.create(session, session.userData.bloodpressuresystolic + " / " + session.userData.bloodpressurediastolic + " mmHg", "Blood Pressure").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "5.6 mmol\\L", "Fasting Glucose").image(builder.CardImage.create(session, "")),                       
                        builder.ReceiptItem.create(session, session.userData.cholesterol + " mmol\\L", "Cholesterol").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, "No", "Diabetic").image(builder.CardImage.create(session, "")),
                        builder.ReceiptItem.create(session, session.userData.smoker, "Smoker").image(builder.CardImage.create(session, ""))                       
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