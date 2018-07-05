function submitToController(){
    // TODO
    alert('done!')
}

function getFromController(){
    // TODO
    sdnData.getRules().forEach(
        rule => rule.stats = Math.floor(Math.random()*100)
    )
}

function enableControllerButtons(){
    let bottoniDiv = document.getElementById('sdn-vertical-buttons')
    bottoniDiv.children[0].disabled = false
    bottoniDiv.children[1].disabled = false    
}