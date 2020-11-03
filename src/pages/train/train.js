// import page styling
require ('./train.css')

// import component styling
require ('../../components/aside/aside.css')
require ('../../components/form/form-row/form-row.css')
require ('../../components/form/form-footer/form-footer.css')
require ('../../components/notification/notification.css')

// external scripts

import { defaultDatabase } from '../../scripts/init-firebase.js';
import { logout } from '../../scripts/logout.js';

logout()

const deleteInputRowTriggers = document.querySelectorAll('[data-delete-row]')
const addInputRowTriggers = document.querySelectorAll('[data-add-input-row]')
const executeTrainingTrigger = document.querySelector('[data-execute-training]')
const notificationHandle = document.querySelector('[data-notification-handle]')
const allStatusClassNames = ['success', 'error']
const traininHistorygRef = defaultDatabase.ref("trainingHistory");
const treeRef = defaultDatabase.ref("tree");
const trainTreeOption = document.querySelector('[train-tree-option]')
const addQuickAnswerFieldTrigger = document.querySelector('[add-quick-answer-field]')
const addExternalFieldTrigger = document.querySelector('[add-external-link-field]')
const stage1 = document.querySelector('[stage-1]')
const stage2 = document.querySelector('[stage-2]')

let treeData = {}

const getDataFromDb = (ref) => {
    return new Promise((resolve, reject) => {
        const onError = error => reject(error);
        const onData = snap => resolve(snap.val());

        ref.on("value", onData, onError);
    });
};

const generateTree = (data) => {
    
    const tree = {}

    data.forEach(key => {
        const stringToArray = key.split(".")
        if (stringToArray.length > 1) {
            stringToArray.pop()
            const newString = stringToArray.join('.')
            if (!tree[newString]) tree[newString] = [key]
            else tree[newString].push(key)
        }  
        else tree[key] = [] 
    })

    const treeByKeys = Object.keys(tree)

    treeByKeys.forEach(key => {
        const optgroup = document.createElement('optgroup')
        optgroup.label = key
        trainTreeOption.append(optgroup)

        tree[key].forEach(innerKey =>{
            const newOption = document.createElement('option')
            newOption.innerHTML = innerKey
            trainTreeOption.append(newOption)
        })        
    })


}

const getData = async () => {
    // console.log('getData');
    const rawData = await getDataFromDb(treeRef)
    const data = JSON.parse(rawData)
    // console.log(data);
    treeData = data
    const allKeys = Object.keys(data)
    generateTree(allKeys)
}
getData()

const removeQuickAnswerOrExternalLink = (event) => {
    event.preventDefault()
    event.target.parentNode.remove()
    // console.log(event.target.parentNode)
}

const createQuickAnswerInputs = (value) => {
    const quickAnswerElement = document.getElementById('quickAnswer')
    const newElement = quickAnswerElement.cloneNode(true)
    newElement.removeAttribute('id')
    newElement.classList.remove('hide')
    const input = newElement.querySelector('input')
    const button = newElement.querySelector('button')
    button.addEventListener('click', removeQuickAnswerOrExternalLink)


    // newInput.placeholder = "referenende naam"
    if (value) input.value = value
    else input.value = ""
    return newElement
}

const createExternalLinkInputs = (value) => {
    const externalLinkElement = document.querySelector('#externalLink')
    const newElement = externalLinkElement.cloneNode(true)
    newElement.removeAttribute('id')
    newElement.classList.remove('hide')
    const button = newElement.querySelector('button')
    button.addEventListener('click', removeQuickAnswerOrExternalLink)

    if (value) {
        const keys = Object.keys(value)
        keys.forEach(key => {
            const type = key === "url" ? 'url' : 'text'
            const input = newElement.querySelector(`input[type="${type}"]`)
            input.value = value[key]
        })
    }
    return newElement
}

const clearInputs = () => {
    const previousUtteranceWrapper = document.querySelector('[previous-utterances]')
    const previousUtteranceLabels = previousUtteranceWrapper.querySelectorAll('label')
    previousUtteranceLabels.forEach(label => {
        label.remove()
    })

    const allTextAreas = document.querySelectorAll('textarea')
    allTextAreas.forEach(textareaField => textareaField.innerHTML = "")

    const chatbotReactionTrainingForm = document.querySelector('#chatbotReactionTrainingForm')
    const allExternalLinkInputs = chatbotReactionTrainingForm.querySelectorAll('.externalLinkWrapper')
    allExternalLinkInputs.forEach(wrapper => {
        if (wrapper.id === "externalLink") return
        wrapper.remove()
    })
    const quickAnswerWrapper = document.querySelector('.quickAnswer')
    const allQuickAnswerInputs = quickAnswerWrapper.querySelectorAll('input')
    allQuickAnswerInputs.forEach(input => {
        if (input.id === "quickAnswer") return
    })
}

const setTreeDataInDOM = (event) => {
    console.log('setTreeDataInDOM');

    stage1.open = false
    stage2.classList.remove('closed-status')
    stage2.open = true

    clearInputs()
    
    const value = event.target.value
    const form = document.querySelector('#chatbotReactionTrainingForm')
    const textarea = form.querySelector('.utterance')
    textarea.innerHTML = treeData[value].message
    textarea.style.height = "";
    textarea.style.height = textarea.scrollHeight + "px"
    const allExternalLinksElement = document.querySelector('#allExternalLinks')
    const quickAnswerWrapper = document.querySelector('.quickAnswer')
    
    console.log(treeData[value]);
    
    if (treeData[value].quickAnswers.length) {
        // console.log('if length');
        // console.log(document.getElementById('quickAnswer'));
        // const inputInWrapper = quickAnswerWrapper.querySelector('input')
        // inputInWrapper.remove()
        treeData[value].quickAnswers.forEach(quickAnswerValue => {
            const newElement = createQuickAnswerInputs(quickAnswerValue)
            quickAnswerWrapper.append(newElement)
        });
    }
    if (!treeData[value].quickAnswers.length) {
        const newElement = createQuickAnswerInputs()
        quickAnswerWrapper.append(newElement)
    }
    
    if (treeData[value].externalLinks.length) {
        
        treeData[value].externalLinks.forEach( externalLinkValue => {
            const newElement = createExternalLinkInputs(externalLinkValue)
            allExternalLinksElement.append(newElement)
        })
    }
    if (!treeData[value].externalLinks.length) {
        const newElement = createExternalLinkInputs()
        allExternalLinksElement.append(newElement)
    }

    if (treeData[value].optionalUtterances && 
        treeData[value].optionalUtterances.length) {
            const utteranceElement = document.querySelector('.utterance')
            const previousWrapper = document.querySelector('[previous-utterances]')
            const formRow = document.querySelector('.form-row')
            console.log(formRow);


            treeData[value].optionalUtterances.forEach(optionalUtterance => {
                const newUtterance = formRow.cloneNode(true)
                const newUtteranceTextarea = newUtterance.querySelector('.utterance')
                const newUtteranceButton = newUtterance.querySelector('button')
                newUtteranceTextarea.innerHTML = optionalUtterance
                newUtteranceButton.addEventListener('click', deleteRowHandler)

                // deleteRowHandler


                // const newUtterance = utteranceElement.cloneNode()
                // const newLabel = document.createElement('label')
                // const newDiv = document.createElement('label')
                // newUtterance.innerHTML = optionalUtterance
                // newDiv.classList.add('label')
                // newDiv.innerHTML = 'Opmerking'
                // newLabel.append(newDiv)
                // newLabel.append(newUtterance)
                previousWrapper.append(newUtterance)
            })
    }
}


const generateId = () => {
    //https://tomspencer.dev/blog/2014/11/16/short-id-generation-in-javascript/
    const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const ID_LENGTH = 12;
    let rtn = '';
    for (let i = 0; i < ID_LENGTH; i++) {
        rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
}





const notificationHandler = (message, status) => {
    message ? notificationHandle.innerHTML = message : notificationHandle.innerHTML = ""
    if (status) {
        const classList = Array.from(notificationHandle.classList)
        classList.forEach(className => {
            if (allStatusClassNames.includes(className)) {
                notificationHandle.classList.remove(className)
            }
        })

        notificationHandle.classList.add(status)
    }
}

const resetStatusStyling = () => {
    const inputsWithStatusClasses = Array.from(document.querySelectorAll('.success, .error'))

    inputsWithStatusClasses.forEach(node => {
        const classList = Array.from(node.classList)
        classList.forEach(className => {
            if (allStatusClassNames.includes(className)) {
                node.classList.remove(className)
            }
        })
    })
    notificationHandler()
}

const deleteRowHandler = event => {
    let parentNode

    // get parent node
    event.path.forEach(node => {
        if (node.className === "form-row") {
            parentNode = node.parentNode
        }
    })

    const allFormRows = parentNode.querySelectorAll('[data-form-row]')
    const targetParents = event.path

    // if user deletes one of more rows
    if (allFormRows.length > 1) {
        targetParents.forEach(node => {
            // remove row from DOM
            if (node.className === "form-row") node.outerHTML = ""
        })
        return
    }

    // if user deletes last row
    const allInputsInLastRow = allFormRows[0].querySelectorAll('textarea, input')
    // remove values from inputs
    allInputsInLastRow.forEach(input => input.value = "")
}

const addRowHandler = (event) => {
    let parentNode

    // get parent node
    event.path.forEach(node => {
        if (node.nodeName === "FIELDSET") {
            parentNode = node
        }
    })

    // get footer based of parent node
    const formFooter = parentNode.getElementsByClassName('form-footer')[0]

    // clone form row based on parent node
    const clonedFormRow = parentNode.querySelector('[data-form-row]').cloneNode(true)
    // const allInputsInClonedFormRow = clonedFormRow.querySelector('input[type=text]')
    const allTextareasInClonedFormRow = clonedFormRow.querySelector('textarea')
    const deleteButtonInClonedFormRow = clonedFormRow.querySelector('[data-delete-row]')

    // clear all input/textarea fields
    // allInputsInClonedFormRow.value = ""
    allTextareasInClonedFormRow.value = ""
    allTextareasInClonedFormRow.removeAttribute('style')

    // attach eventListener to delete button
    deleteButtonInClonedFormRow.addEventListener('click', deleteRowHandler)

    parentNode.insertBefore(clonedFormRow, formFooter)
}

const executeTraining = async (e) => {
    const userInputTrainingForm = document.getElementById('userInputTrainingForm')
    const chatbotReactionTrainingForm = document.getElementById('chatbotReactionTrainingForm')

    resetStatusStyling()

    const chosenIntent = document.querySelector('[train-tree-option]').value
    const allQuickAnswersInDOM = chatbotReactionTrainingForm.querySelector('.quickAnswer')
    const allExternalLinksInDOM = chatbotReactionTrainingForm.querySelectorAll('.externalLinkWrapper')
    const allQuickAnswerInputs = allQuickAnswersInDOM.querySelectorAll('input')
    const getAllOptionalUtterances = userInputTrainingForm.querySelectorAll('.utterance')

    const getValueOfChosenIntent = () =>{
        return chosenIntent.split('.').pop()
    }

    const value = getValueOfChosenIntent()
    const message = chatbotReactionTrainingForm.querySelector('.utterance').innerHTML
    const quickAnswers = []
    const externalLinks = []
    const optionalUtterances = []
    
    allQuickAnswerInputs.forEach(quickAnswer => {
        if (quickAnswer.value) quickAnswers.push(quickAnswer.value)
    })
    
    allExternalLinksInDOM.forEach(externalLink => {
        const allInputs = externalLink.querySelectorAll('input')
        const obj = {}
        allInputs.forEach(input => {
            const key = input.type === 'url' ? 'url' : 'value'
            if (input.value) obj[key] = input.value
        })
        if (Object.keys(obj).length) externalLinks.push(obj)  
    })
    
    getAllOptionalUtterances.forEach(utterance => {
        if (utterance.value) optionalUtterances.push(utterance.value)
    })
    
    // console.log({value, message, quickAnswers ,externalLinks, optionalUtterances});

    const combinedData = {value, message, quickAnswers ,externalLinks, optionalUtterances}

    // console.log(chosenIntent);
    treeData[chosenIntent] = combinedData
    // const treeData = await getDataFromDb(treeRef)
    // console.log(treeData);
    treeRef.set(JSON.stringify(treeData))
    console.log('data has been set');
    executeTrainingTrigger.disabled = true
    const beforeWrapper = executeTrainingTrigger.querySelector('.before')
    const afterWrapper = executeTrainingTrigger.querySelector('.after')
    beforeWrapper.classList.add('animate')
    afterWrapper.classList.add('animate')
    setTimeout(() => {
        executeTrainingTrigger.disabled = false
        beforeWrapper.classList.remove('animate')
        afterWrapper.classList.remove('animate')
        clearInputs()
    }, 4000);
}
// const executeTraining = async (e) => {
//     const userInputTrainingForm = document.getElementById('userInputTrainingForm')
//     const chatbotReactionTrainingForm = document.getElementById('chatbotReactionTrainingForm')

//     resetStatusStyling()


//     const allInputsValues = async () => {
//         const queu = [userInputTrainingForm, chatbotReactionTrainingForm]
//         let missingValue = false
//         let duplicateValue = false
//         let alreadyExist = false
//         let formIsEmpty = false
//         const historyTrainingData = await getDataFromDb(traininHistorygRef)
//         const strippedHistoryTrainingData = historyTrainingData ? Object.values(historyTrainingData) : false
//         const trainingData = {}

//         queu.forEach(form => {
//             const id = form.id
//             const filteredHistoryTrainingData = {
//                 language: [],
//                 intent: [],
//                 utterance: []
//             }

//             if (strippedHistoryTrainingData) {
//                 strippedHistoryTrainingData.forEach(e => {
//                     if (!e.trainingData[id]) return
//                     e.trainingData[id].forEach(value => {
//                         const { language, intent, utterance } = value
//                         filteredHistoryTrainingData.language.push(language)
//                         filteredHistoryTrainingData.intent.push(intent)
//                         filteredHistoryTrainingData.utterance.push(utterance)
//                     })
//                 })
//             }

//             const row = Array.from(form.querySelectorAll('[data-form-row]'))
//             const utteranceCollection = []

//             const rows = row.map((formRow, index) => {
//                 const inputObj = {
//                     id: generateId(),
//                     language: '',
//                     intent: '',
//                     utterance: ''
//                 }
//                 const inputTypes = Array.from(formRow.querySelectorAll('select, textarea, input'))
//                 let isOnlyOneInput = false

//                 inputTypes.forEach(input => {
//                     // check if one of the forms is left empty
//                     if (!input.value && index === row.length - 1) {
//                         isOnlyOneInput = true
//                         return
//                     }
//                     // checks if all input fields are filled in
//                     if (!input.checkValidity()) {
//                         missingValue = true
//                         input.classList.add('error')
//                         notificationHandler('Niet alle inputs zijn ingevuld!', 'error')
//                         return
//                     }

//                     if (input.classList.contains('language')) inputObj.language = input.value
//                     if (input.classList.contains('intent')) inputObj.intent = input.value

//                     if (input.classList.contains('utterance')) {
//                         // check if input already exist
//                         if (utteranceCollection.includes(input.value)) {
//                             duplicateValue = true
//                             input.classList.add('error')
//                             notificationHandler('Er zijn opmerkingen met dezelfde waarde!', 'error')
//                             return
//                         }
//                         const inputExistsInDb = filteredHistoryTrainingData.utterance.includes(input.value)
//                         if (inputExistsInDb) {
//                             alreadyExist = true
//                             input.classList.add('error')
//                             notificationHandler('Deze waarde is al eerder toegevoegd!', 'error')
//                         }

//                         // push unique utterance to array
//                         utteranceCollection.push(input.value)
//                         inputObj.utterance = input.value
//                     }
//                 })

//                 const rowIsEmpty = () => {
//                     const keys = Object.keys(inputObj)
//                     if (keys.length === 1 && keys[0] === 'language') return true
//                     return false
//                 }
//                 if (rowIsEmpty()) {
//                     return false
//                 }

//                 if (isOnlyOneInput) {
//                     const hasEmptyValue = Object.values(inputObj).includes('')
//                     if (hasEmptyValue) return
//                 }
//                 return inputObj
//             })

//             if (rows[0]) trainingData[form.id] = rows
//         })
//         // if form is not empty
//         if (!Object.keys(trainingData).length) {
//             notificationHandler('Er is geen trainingsdata ingevuld!', 'error')

//         }

//         const valueIsIncorrect = missingValue || duplicateValue || alreadyExist || formIsEmpty

//         return { valueIsIncorrect, trainingData }
//     }

//     const result = await allInputsValues()

//     // if value is missing in form, this will be false
//     if (!result.valueIsIncorrect) {
//         const { trainingData } = result
//         const trainingId = Date.now()
//         const date = new Date().toLocaleString()

//         const historyObj = {
//             'trainedBy': '',
//             'date': date,
//             'trainingData': trainingData
//         }
//         const traininHistoryChildRef = traininHistorygRef.child(`${trainingId}`);

//         // use to post data to firebase
//         traininHistoryChildRef.update(historyObj)
//         deleteInputRowTriggers.forEach((deleteButton, index) => {
//             // https://stackoverflow.com/a/49117631
//             try {
//                 // For modern browsers except IE:
//                 const event = new CustomEvent('click');
//             } catch (err) {
//                 // If IE 11 (or 10 or 9...?) do it this way:

//                 // Create the event.
//                 const event = deleteButton.createEvent('Event');
//                 // Define that the event name is 'build'.
//                 event.initEvent('click', true, true);
//             }
//             deleteButton.dispatchEvent(new Event("click"))
//         })
//         notificationHandler('Training voltooid!', 'success')
//     }
// }

deleteInputRowTriggers.forEach(deleteButton => {
    deleteButton.addEventListener('click', deleteRowHandler)
})

addInputRowTriggers.forEach(addButton => {
    addButton.addEventListener('click', addRowHandler)
})

executeTrainingTrigger.addEventListener('click', executeTraining)

trainTreeOption.addEventListener('change', setTreeDataInDOM)
addQuickAnswerFieldTrigger.addEventListener('click', (event) => {
    event.preventDefault()
    const quickAnswerWrapper = document.querySelector('#allQuickAnswers')
    const newElement = createQuickAnswerInputs()
    quickAnswerWrapper.append(newElement)
})
addExternalFieldTrigger.addEventListener('click', (event) => {
    event.preventDefault()
    const allExternalLinksElement = document.querySelector('#allExternalLinks')
    const newElement = createExternalLinkInputs()
    allExternalLinksElement.append(newElement)
})