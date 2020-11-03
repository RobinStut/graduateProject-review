// import page styling
require('./chatbot.css')

// import component styling
require ('../../components/aside/aside.css')

// external scripts

import { logout } from '../../scripts/logout.js';

logout()

const inputTrigger = document.querySelector('[chatbox-input]')
const launchChatboxTrigger = document.querySelector('[chatbox-launch]')
const closeChatboxTrigger = document.querySelector('[chatbox-close]')
const chatbox = document.querySelector('[chatbox-content]')
const inputSubmitTrigger = document.querySelector('[chatbox-input-submit]')
const restartChatboxTrigger = document.querySelector('[chatbox-restart]')
const chatboxMessages = document.querySelector('[chatbox-messages]')
let isFirstMessage = true

const debounce = (func, wait, immediate) => {
	let timeout;
	return function() {
		const context = this, args = arguments;
		const later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

const loadingDots = () => {
    const firstDot = document.createElement('span')
    const secondDot = document.createElement('span')
    const thirthDot = document.createElement('span')
    const wrapper = document.createElement('div')
    firstDot.classList.add('dot') 
    secondDot.classList.add('dot') 
    thirthDot.classList.add('dot') 
    wrapper.classList.add('loading') 
    wrapper.append(firstDot, secondDot, thirthDot)
    return wrapper
}

const createMessageElements = (data, node) => {
    console.log(data);
    const message = data.result.message
    const quickAnswers = data.result.quickAnswers
    const externalLinks = data.result.externalLinks
    const allQuickOptions = document.createElement('li')
    const quickOptions = document.createElement('ul')
    quickOptions.classList.add('chatbox-quick-options')
    node.innerText = message
    
    if (quickAnswers && quickAnswers.length) {
        quickAnswers.forEach(quickAnswer => {
            const quickOption = document.createElement('button')
            quickOption.classList.add('chatbox-quick-option')
            quickOption.innerText = quickAnswer
            quickOption.value = quickAnswer
            quickOption.addEventListener('click', quickAnswerClicked)
            quickOptions.append(quickOption)
        })
    }
    
    if (externalLinks && externalLinks.length) {
        externalLinks.forEach(link => {
            const externalLink = document.createElement('a')
            externalLink.classList.add('chatbox-quick-option')
            externalLink.innerText = link.value
            externalLink.value = link.value
            externalLink.href = link.url
            quickOptions.append(externalLink)
        })
    }
    allQuickOptions.append(quickOptions)
    chatboxMessages.append(allQuickOptions)

    chatboxMessages.scrollTop = chatboxMessages.scrollHeight

}

const quickAnswerClicked = async (event) => {
    const chosenValue = event.target.value
    const parent = event.target.parentNode
    parent.outerHTML = chosenValue
    if (parent.classList.contains('incoming')) {
        parent.classList.remove('incoming')
    }
    event.path.forEach(node => {
        if (!node.parentNode) return
        if (!node.parentNode.classList) return
        if (node.parentNode.classList.contains('chat-content')) {
            node.classList.add('outgoing')
        }
    })
    const newNode = preMessage()
    const data = await sendQuickAnswer(chosenValue)
    createMessageElements(data, newNode)

    chosenValue !== "overig" ? inputTrigger.disabled = true : inputTrigger.disabled = false
    chosenValue !== "overig" ? inputTrigger.placeholder = "Maak een keuze" : inputTrigger.placeholder = "typ je bericht"
}

const openChatbox = async () => {
    launchChatboxTrigger.classList.toggle('hide')
    chatbox.classList.toggle('hide')
    if (isFirstMessage) {
        const newNode = preMessage()
        const data = await sendMessage('start')
        createMessageElements(data, newNode)
        isFirstMessage = false
    }
}

const preMessage = () => {
    const newMessage = document.createElement('li')
    newMessage.classList.add('incoming')
    newMessage.append(loadingDots())
    chatboxMessages.append(newMessage)
    return newMessage
}

const closeChatbox = () => {
    if (launchChatboxTrigger.classList.contains('hide')) {
        launchChatboxTrigger.classList.toggle('hide')
    }
    if (!chatbox.classList.contains('hide')) {
        // launchChatboxTrigger.classList.toggle('hide')
        chatbox.classList.toggle('hide')
    }
}

const inputChange = debounce((event) => {
    const inputHasValue = event.target.value
    const submitButton = inputSubmitTrigger
    inputHasValue ? submitButton.disabled = false : submitButton.disabled = true
}, 250);

const sendMessage = async (message) => {
    return await fetch(`/.netlify/functions/ask?message=${message}`)
    .then(async response => response.json())
    .then(json => {
        return json
    })
    .catch(e => {
        return e
    })
}

const sendQuickAnswer = async (message) => {
    return await fetch(`/.netlify/functions/ask?quickAnswer=${message}`)
    .then(async response => response.json())
    .then(json => {
        return json
    })
    .catch(e => {
        return e
    })
}

const restartChatbox = async (event) => {
    chatboxMessages.innerHTML = ""
    const newNode = preMessage()
    const data = await sendMessage('start')
    createMessageElements(data, newNode)
}

const isClickedOutside = event =>  {
    const path = event.path

    const containsChatbox = path.map(item => {
        if (!item.classList) return
        if (item.classList.contains('chatbox')) return true
    })

    if (!containsChatbox.includes(true)) closeChatbox()
}

const submitCustomInput = async (event) => {
    const value = inputTrigger.value
    const newOutgoingNode = document.createElement('li')
    newOutgoingNode.classList.add('outgoing')
    newOutgoingNode.innerText = value
    chatboxMessages.append(newOutgoingNode)
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight
    inputTrigger.disabled = true
    inputSubmitTrigger.disabled = true
    inputTrigger.placeholder = "Maak een keuze"
    inputTrigger.value = ""
    
    const newNode = preMessage()
    const data = await sendMessage(value)
    createMessageElements(data, newNode)

    // createMessageElements(data, newNode)

}

window.addEventListener('click', isClickedOutside)
inputTrigger.addEventListener('keydown', inputChange)
closeChatboxTrigger.addEventListener('click', closeChatbox)
launchChatboxTrigger.addEventListener('click', openChatbox)
restartChatboxTrigger.addEventListener('click', restartChatbox)
inputSubmitTrigger.addEventListener('click', submitCustomInput)