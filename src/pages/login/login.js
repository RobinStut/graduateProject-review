// import page styling
require('./login.css')

// component styling
require ('../../components/notification/notification.css')

import { auth } from '../../scripts/init-firebase.js';

const emailInput = document.querySelector('[email-input]')
const passwordInput = document.querySelector('[password-input]')
const loginTrigger = document.querySelector('[login-button]')
const signUpTrigger = document.querySelector('[signUp-button]')
const registerTrigger = document.querySelector('[register-button]')
const form = document.querySelector('[login-form]')
const notificationHandle = document.querySelector('[data-notification-handle]')
const allStatusClassNames = ['success', 'error']
let signUpClicked = false

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

const firebaseError = {
    "auth/weak-password": "Wachtwoord moet minstens 6 karakters bevatten.",
    "auth/email-already-in-use": "Het e-mailadres is al in gebruik door een ander account.",
    "auth/wrong-password": "Het wachtwoord is ongeldig of de gebruiker heeft geen wachtwoord.",
    "auth/invalid-email": "Het e-mailadres is slecht geformatteerd.",
    "auth/user-not-found": "Er is geen gebruikersnaam die overeenkomt met deze referentie. De gebruiker kan zijn verwijderd."
}

const submitForm = (e) => {
    e.preventDefault()
    notificationHandler()
    const userPressedLogin = !loginTrigger.classList.contains('hide');
    const email = emailInput.value
    const pass = passwordInput.value

    if (userPressedLogin) {
        auth.signInWithEmailAndPassword(email, pass)
            .then(() => window.location.replace("/dashboard.html"))
            .catch(e => {
                console.log(e);
                const message = firebaseError[e.code]
                notificationHandler(message, 'error')
            })
        return
    }

    const repeatPass = document.querySelector('[repeatPassword-input]')
    const passIsEqual = pass === repeatPass.value

    if (!passIsEqual) {
        passwordInput.classList.add('error')
        repeatPass.classList.add('error')

        notificationHandler('Wachtwoorden komen niet overeen!', 'error')
        return
    }
    // else
    auth.createUserWithEmailAndPassword(email, pass)
        .then(() => window.location.replace("/dashboard.html"))
        .catch(e => {
            console.log(e);
            const message = firebaseError[e.code]
            notificationHandler(message, 'error')
        })
}

loginTrigger.addEventListener('click', submitForm)


signUpTrigger.addEventListener('click', e => {
    e.preventDefault()
    if (signUpClicked) return
    const injectAfterLabel = passwordInput.parentElement.nextSibling
    const repeatPasswordNode = passwordInput.cloneNode()
    const repeatPasswordLabel = document.createElement("label")
    const repeatPasswordLabelText = document.createTextNode("Herhaal wachtwoord");

    repeatPasswordNode.removeAttribute('password-input');
    repeatPasswordNode.setAttribute('repeatPassword-input', '');
    repeatPasswordLabel.appendChild(repeatPasswordLabelText)
    repeatPasswordLabel.appendChild(repeatPasswordNode)

    form.insertBefore(repeatPasswordLabel, injectAfterLabel)
    loginTrigger.classList.toggle('hide')
    signUpTrigger.classList.toggle('hide')
    registerTrigger.classList.toggle('hide')
    signUpClicked = true
})

registerTrigger.addEventListener('click', submitForm)

form.addEventListener('submit', submitForm)

auth.onAuthStateChanged(firebaseUser => {
    if (firebaseUser) window.location.replace("../train")
    else console.log('not logged in');
})
