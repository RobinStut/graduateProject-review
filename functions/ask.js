const { google } = require('googleapis')
const axios = require('axios')
const { dockStart } = require('@nlpjs/basic');

const {
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY
} = process.env

const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/gm, '\n')
const treeDataUrl = 'https://graduate-16c74.firebaseio.com/tree.json/'

const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/firebase.database"
];
const jwt = new google.auth.JWT(GOOGLE_CLIENT_EMAIL, null, privateKey, scopes);

exports.handler = async function (event, context) {
    const receivedMessage = event.queryStringParameters.message
    const receivedQuickAnswer = event.queryStringParameters.quickAnswer

    try {

        const token = await new Promise((resolve, reject) => jwt.authorize(async (error, tokens) => {
            if (error) {
                reject(new Error('Error making request to generate token'))
            } else if (!tokens.access_token) {
                reject(new Error('Provided service account doest not have permission to generate access tokens'))
            }
            resolve(tokens.access_token)
        }))

        if (!token)  return null;

        const headers = { Authorization: 'Bearer ' + token }

        const { data: rawData = data } = await axios.get(treeDataUrl, { headers })

        const treeData = JSON.parse(rawData)

        const calculateResult = async (data) => {
            const bestClassificatedResult = data.classifications[0] 

            if (bestClassificatedResult.intent === "None") {

                const classificatedAsNoneURL = 'https://graduate-16c74.firebaseio.com/classificatedAsNone.json/'
                axios.post(classificatedAsNoneURL, {value: data.utterance}, { headers })

                return {
                        "value": "none",
                        "message": "Ik begrijp je vraag niet goed. Stel je vraag op een andere manier, of neem contact op met de Customer care.",
                        "quickAnswers": [],
                        "externalLinks": [
                            {
                                "value": "Customer care",
                                "url": "/"
                            }
                        ]
                }
            }
            return treeData[bestClassificatedResult.intent] 
        }

        if (receivedMessage) {
            if (receivedMessage === "start") {
                const data = treeData[receivedMessage]
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        'result': data,
                        'statusCode': 200
                    }
                    )
                }
            }
            else {
                const allTreeDataKeys = Object.keys(treeData)
                const allOptionalUtterances = []

                const dock = await dockStart({ use: ['Basic'], autoSave: false, modelFileName: '/tmp/model.nlp' });
                const nlp = dock.get('nlp');

                nlp.load('/tmp/model.nlp')
                nlp.addLanguage('nl');

                allTreeDataKeys.forEach(key => {
                    if (treeData[key].optionalUtterances && treeData[key].optionalUtterances.length) {
                        treeData[key].optionalUtterances.forEach(utterance => {
                            allOptionalUtterances.push(
                                {
                                    message: treeData[key].message,
                                    intent: key,
                                    utterance: utterance
                                }
                            )  
                        })
                    }
                })
                
                allOptionalUtterances.forEach(item => {
                    const language = 'NL'
                    const currentIntent = item.intent
                    const currentUtterance = item.utterance
                    const currentAnswer = item.message

                    nlp.addDocument(language, currentUtterance, currentIntent);
                    nlp.addAnswer(language, currentIntent, currentAnswer);
                })

                try {
                    await nlp.train()
                }
                catch (error) {
                    console.log(error);
                }
                const result = await nlp.process('nl', receivedMessage)
                const answer = await calculateResult(result)

                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        'result': answer,
                        'statusCode': 200
                    }
                    )
                }

            }
        }

        if (receivedQuickAnswer) {
                const allValues = Object.values(treeData)
                const currentValueFinder = entry => entry.value === receivedQuickAnswer
                const currentValue = allValues.find(currentValueFinder)
    
                if (currentValue) {
                    return {
                        statusCode: 200,
                        body: JSON.stringify({
                            'result': currentValue,
                            'statusCode': 200
                        }
                        )
                    }
                }   
        }
    }
    catch (e) {
        return {
            statusCode: 500,
            body: e.message
        }
    }
};