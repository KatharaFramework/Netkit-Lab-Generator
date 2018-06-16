function submitToController(){
    // TODO
    alert('done!')
}

function getFromController(){
    // TODO
    sdnData.getRules().forEach(
        el => el.rules.forEach(
            el => el.stats = Math.floor(Math.random()*100)
        )
    )
}

function enableControllerButtons(){
    let bottoniDiv = document.getElementById('comandiSDN')
    bottoniDiv.children[0].disabled = false
    bottoniDiv.children[1].disabled = false    
}