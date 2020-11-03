// import page styling
require('./tree.css')

// import component styling
require ('../../components/aside/aside.css')
require ('../../components/tree/tree.css')

// external scripts
import { defaultDatabase } from '../../scripts/init-firebase.js';
import { logout } from '../../scripts/logout.js';
logout()

const treeElement = document.querySelectorAll('span')
const modalEditButton = document.querySelector('[modal-edit]')
const modalAddButton = document.querySelector('[modal-add]')
const modalRotateButton = document.querySelector('[modal-rotate]')
const modalDeleteButton = document.querySelector('[modal-delete]')
const saveTreeButton = document.querySelector('[save-tree]')
const allStatusClassNames = ['success', 'error']

const notificationHandler = (message, status) => {
    const notificationHandle = document.querySelector('[data-notification-handle]')
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

const getOffset = el => {
    const rect = el.getBoundingClientRect()
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const top = rect.top + scrollTop
    const left = rect.left + scrollLeft
    const bottom = rect.bottom + scrollTop
    const right = rect.right + scrollLeft
    const middleHorizontal = Math.round(((right - left) / 2) + left)

    return {
        top, left, bottom, right, middleHorizontal
    }
}

const modal = node => {
    const modalInDOM = document.querySelector('[modal]')

    if (modalInDOM.classList.contains('hide')) modalInDOM.classList.toggle('hide')

    // get offsets
    const nodeOffset = getOffset(node)
    const modelOffset = getOffset(modalInDOM)

    // calculate new offset
    const newOffsetLeft = nodeOffset.middleHorizontal - (modelOffset.middleHorizontal - modelOffset.left)
    const newOffsetTop = nodeOffset.bottom + 10

    // set new offset 
    modalInDOM.style.left = `${newOffsetLeft}px`
    modalInDOM.style.top = `${newOffsetTop}px`
}

const treeElementClick = event => {
    // remove active class if it already exists
    const isNotFirstActive = document.getElementById('active')
    if (isNotFirstActive) document.getElementById('active').id = ""

    const ignoreNodeList = ['input', 'button']
    const clickedOnIgnoredNode = ignoreNodeList.includes(event.target.localName)


    if (!clickedOnIgnoredNode) {
        event.target.id = 'active'
        modal(event.target)
    }
}

treeElement.forEach(span => {
    span.addEventListener('click', treeElementClick)
})

const addToJSONObject = (nodes) => {
    let { currentNode, newListItem } = nodes

    const newListItemValue = newListItem.querySelector('span').innerText

    let allParents = [];
    while (currentNode.parentNode) {
        allParents.unshift(currentNode.parentNode);
        currentNode = currentNode.parentNode;
    }

    const allParentListItems = allParents.filter(node => node.localName === 'li')
    const allPathValues = allParentListItems.map(li => li.querySelector('span').innerText)

    const setValue = (params) => {
        let { obj, path, childValue } = params
        let index;

        if (path.length === 1) {
            if (!conversionalTreeModel[path[0]]) {
                conversionalTreeModel[path[0]] = childValue
                return
            }
            else {
                const childKey = Object.keys(childValue)[0]
                const value = Object.values(childValue)[0]
                conversionalTreeModel[path[0]][childKey] = value
                return
            }
        }

        // else
        for (index = 0; index < path.length - 1; index++) {
            obj = obj[path[index]];
        }

        obj[path[index]] = childValue;
    }

    setValue({
        obj: conversionalTreeModel,
        childValue: { [newListItemValue]: {} },
        path: allPathValues
    })
}

const confirmNewElement = event => {
    const inputNode = event.target.parentNode.querySelector('input')
    const buttonNode = event.target.parentNode.querySelector('button')
    const inputValue = event.target.parentNode.querySelector('input').value
    const parent = event.target.parentNode
    const newListItem = parent.parentNode
    const currentNode = newListItem
    const input = event.target.parentNode.querySelector('input')

    if (inputValue === "") {
        input.classList.add('error')
        notificationHandler('Een veld kan niet leeg blijven', 'error')
    }
    else {
        inputNode.remove()
        buttonNode.remove()
        parent.innerText = inputValue
        addToJSONObject({ currentNode, newListItem })
    }
}

const overwriteChangedElement = event => {
    const input = event.target.parentNode.querySelector('input')
    const newInputValue = input.value
    const oldInputValue = input.dataset.oldValue
    let currentNode = event.target.parentNode

    const inputsToSpan = () => currentNode.innerHTML = newInputValue


    if (newInputValue === "") {
        console.log('leeg');
        return
    }
    inputsToSpan()

    let allParents = [];

    while (currentNode.parentNode) {
        allParents.unshift(currentNode.parentNode);
        currentNode = currentNode.parentNode;
    }

    const allParentListItems = allParents.filter(node => node.localName === 'li')
    const allPathValues = allParentListItems.map(li => li.querySelector('span').innerText)

    if (allPathValues.length === 1) {
        allPathValues[0]
        const oldValue = conversionalTreeModel[oldInputValue]
        delete conversionalTreeModel[oldInputValue];
        conversionalTreeModel[newInputValue] = oldValue
        return
    }

    const stringified = JSON.stringify(conversionalTreeModel)
    conversionalTreeModel = JSON.parse(stringified.replace(oldInputValue, newInputValue))
}

const editModalAction = event => {
    const currentNode = document.querySelector('#active')
    const currentNodeValue = currentNode.innerText

    const newInputItem = document.createElement('input')
    const newConfirmButtonItem = document.createElement('button')

    newInputItem.dataset.oldValue = currentNodeValue
    newInputItem.value = currentNodeValue
    newConfirmButtonItem.innerText = "Bevestig"

    newInputItem.addEventListener('keydown', (keydownEvent) => {
        const submitKeyArray = ['Enter', 'Escape']
        if (submitKeyArray.includes(keydownEvent.code)) overwriteChangedElement(keydownEvent)
    })
    newConfirmButtonItem.addEventListener('click', overwriteChangedElement)

    currentNode.innerText = ""
    currentNode.append(newInputItem)
    currentNode.append(newConfirmButtonItem)
   
}

const addModalAction = event => {
    const currentNode = document.getElementById('active')
    const parentNodeElement = currentNode.parentNode
    const allCurrentNodeSibblings = [...currentNode.parentNode.children]
    const allTagNamesOfCurrentNodeSibblings = allCurrentNodeSibblings.map(node => node.localName)

    // create new Element
    const newListItem = document.createElement('li');
    const newSpanItem = document.createElement('span');
    const newInputItem = document.createElement('input')
    const newConfirmButtonItem = document.createElement('button')
    newConfirmButtonItem.innerText = "Bevestig"
    newInputItem.addEventListener('keydown', (event) => {
        const submitKeyArray = ['Enter', 'Escape']
        if (submitKeyArray.includes(event.code)) confirmNewElement(event)
    })
    newConfirmButtonItem.addEventListener('click', confirmNewElement)
    newSpanItem.appendChild(newInputItem)
    newSpanItem.appendChild(newConfirmButtonItem)
    newListItem.appendChild(newSpanItem)
    newListItem.addEventListener('click', treeElementClick)

    // addToJSONObject({ currentNode, newListItem })

    if (allTagNamesOfCurrentNodeSibblings.includes('ul')) {
        const unordenedList = parentNodeElement.querySelector('ul')
        unordenedList.append(newListItem)
        newInputItem.focus()
    }
    else {
        const newUnorderedList = document.createElement('ul');
        newUnorderedList.append(newListItem)
        parentNodeElement.append(newUnorderedList)
        newInputItem.focus()
    }
}

const rotateModelAction = event => {
    const currentNode = document.getElementById('active')
    const allCurrentNodeSibblings = [...currentNode.parentNode.children]
    const allTagNamesOfCurrentNodeSibblings = allCurrentNodeSibblings.map(node => node.localName)

    if (!allTagNamesOfCurrentNodeSibblings.includes('ul')) return

    const unorderedList = currentNode.parentNode.querySelector('ul')
    unorderedList.classList.toggle('vertical')
}

const removeFromJSON = event => {
    let currentNode = document.querySelector('#active')
    let allParents = [];

    while (currentNode.parentNode) {
        allParents.unshift(currentNode.parentNode);
        currentNode = currentNode.parentNode;
    }

    const allParentListItems = allParents.filter(node => node.localName === 'li')
    const allPathValues = allParentListItems.map(li => li.querySelector('span').innerText)
    const path = allPathValues.toString().replaceAll(",", ".");

    // Source: https://stackoverflow.com/a/5060288/14366546
    const deepDelete = (target, context) => {
        const targets = target.split('.');
        
        if (targets.length > 1) {
            deepDelete(targets.slice(1).join('.'), context[targets[0]]);
        }
        else delete context[target]
    }

    deepDelete(path, conversionalTreeModel);
}

const deleteModelAction = event => {
    const currentNode = document.getElementById('active')
    if (currentNode.parentNode.id === 'base') return
    removeFromJSON(event)
    currentNode.parentNode.remove()
}

const hideModel = event => {
    const clickedOnActivePath = event.path.some(item => item.id === 'active')
    const clickedInsideOfTree = event.path.some(item => {
        if (item.classList && item.classList.value.includes('tree')) {
            return item
        }
    })
    const targetId = event.target.id
    const targetTagName = event.target.localName
    const ignoreNodeNames = ['input', 'button']
    const nodeModal = document.querySelector('.modal')

    if (!clickedOnActivePath && 
        (ignoreNodeNames.includes(targetTagName) && targetId === 'active')) {
        nodeModal.classList.toggle('hide')
    }
    if (!clickedInsideOfTree) {
        if (!nodeModal.classList.contains('hide')) nodeModal.classList.add('hide')
    }
}

const saveTreeAction = (event) => {
    treeModelDbRef.set(JSON.stringify(conversionalTreeModel))
}

document.addEventListener('click', hideModel)
modalEditButton.addEventListener('click', editModalAction)
modalAddButton.addEventListener('click', addModalAction)
modalRotateButton.addEventListener('click', rotateModelAction)
modalDeleteButton.addEventListener('click', deleteModelAction)
saveTreeButton.addEventListener('click', saveTreeAction)

// Create Tree by data

const treeModelDbRef = defaultDatabase.ref("treeModel");

const getDbData = (ref) => {
    return new Promise((resolve, reject) => {
        const onError = error => reject(error);
        const onData = snap => resolve(snap.val());

        ref.on("value", onData, onError);
    });
};

const createTree = (obj, node) => {
    let keys = Object.keys(obj)

    keys.forEach((key, index) => {
        const hasChilds = Object.keys(obj[key]).length

        if (index === 0) {
            const newLI = document.createElement('li')
            const newSPAN = document.createElement('span')
            const newUL = document.createElement('ul')
            newSPAN.innerText = key
            newSPAN.addEventListener('click', treeElementClick)
            newUL.append(newLI)
            node.append(newSPAN)

            if (hasChilds) {
                node.append(newUL)
                createTree(obj[key], newLI)
            }
        }

        else {
            const newLI = document.createElement('li')
            const newSPAN = document.createElement('span')
            const newUL = document.createElement('ul')
            newSPAN.innerText = key
            newSPAN.addEventListener('click', treeElementClick)
            newUL.append(newLI)
            newLI.append(newSPAN)          
            node.parentNode.append(newLI)

            if (hasChilds) {
                const target = () => {
                    const allSPANs = Object.values(document.querySelectorAll('span'))
                    const currentNode = allSPANs.filter(span => {
                        if (span.innerText === key) return span
                    })[0]
                    return currentNode.parentNode
                }

                const secondNewLI = document.createElement('li')
                const secondNewUL = document.createElement('ul')
                secondNewUL.append(secondNewLI)
                target().append(secondNewUL)
                createTree(obj[key], secondNewLI)
            }
        }

    })
}

let conversionalTreeModel = {}

let getConversionalTreeModel = async () => {
    const dbData = await getDbData(treeModelDbRef)
    return JSON.parse(dbData)
}

const buildTree = async () => {
    conversionalTreeModel = await getConversionalTreeModel()
    const treeBase = document.querySelector('#base')
    const hasKeys = Object.keys(conversionalTreeModel).length
    const obj = hasKeys ? conversionalTreeModel : { 'Nieuw': {} }
    createTree(obj, treeBase)
}

buildTree()