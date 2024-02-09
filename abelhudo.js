const word = document.querySelector('#word')
const charGrid = document.querySelector('.charGrid')
const error = document.querySelector('error')
const loading = document.querySelector("loading")
const counter = document.querySelector('#counter')
const foundWords = []
let retry = 30
const allChars = ["a", "ã", "b", "c", "ç", "d", "e", "f", "g", "h", "i", "j", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "x", "z"]
const charMap = {
    a: 'aáâ',
    e: 'eéê',
    i: 'ií',
    o: 'oóõô',
    u: 'uúü'
}

function chooseChars(){
    const alternatives = [...allChars]
    const chars = Array(7)
    .fill()
    .map(() => {
        const chosen = alternatives.splice(random(alternatives.length-1), 1)
        return chosen
    })
    
    const mainChar = chars[random(chars.length-1)]
    return [chars, mainChar]
}
//const wordsListUrl = 'https://www.ime.usp.br/~pf/dicios/br-utf8.txt'
const wordsListUrl = 'br-utf8.txt'
function createRegex(chars, mainChar){
    const charsRegex = chars.map(char => charMap[char]??char).join('')
    const mainCharRegex = charMap[mainChar]??mainChar
    return new RegExp(`^(?=[${charsRegex}]*${mainCharRegex}+)[${charsRegex}]{4,}$`,'gim')
}

async function fetchWords(chars, mainChar){
    const wordRegex = createRegex(chars,mainChar)
    try{
        const wordsFile= await fetch(wordsListUrl).then(x => x.text())
        const filteredWords = wordsFile.match(wordRegex)
        if(filteredWords?.length < 50 && filteredWords?.length > 10 ) return filteredWords.map(word=>word.toLowerCase())
    }catch(error){
        console.error(error.message)
        setError( error.message )
    }finally{
     retry--
    }
}
function sanitize(str){
    return str
    .replace(/[áâ]/g, "a")
    .replace(/[éê]/g,"e")
    .replace(/[í]/g, "i")
    .replace(/[óõô]/g,"o")
    .replace(/[ú]/g, "u")
}

function enableActions(chars,mainChar, wordsList){
    function validateWord(word){
        if(!word || !word.length || word.length <= 3) throw new Error ("A palavra precisa ser maior.")

        if(!word.includes(mainChar)) throw new Error("Não possui a letra obrigatória.")
        const wordsToAdd = wordsList.filter(w=>{
            return sanitize(w) === word.toLowerCase()
        })
        if(foundWords.filter(word => wordsToAdd.includes(word)).length) throw new Error("Palavra já encontrada")
        if(!wordsToAdd.length) throw new Error('Palavra não encontrada.')
        return wordsToAdd
    }



    document.querySelector('#enter').addEventListener('click', ()=>{
        const candidateWord= word.innerHTML
        try{
            const wordsFound = validateWord(candidateWord)
            addToFound(wordsFound)
            updateScore()
        }catch(error){
            setError(error.message)
        }finally{
            setWord('')
        }
    })


    document.querySelector('#delete').addEventListener('click', ()=>{
        const currentWord = word.innerHTML
        setWord(currentWord.substring(0, currentWord.length-1))
    })


    document.querySelector('#reset').addEventListener('click', ()=>{
        setWord('')
    })
    
    document.querySelector('#shuffle').addEventListener('click', ()=>{
        shuffleLetters(chars,mainChar)
    })
    
    counter.addEventListener('click', ()=>{
        reference.classList.toggle('show')
    })
    
}

function updateScore(){
    if(foundWords.length === wordsList.length){
        win()
    }
}
function setWord (newWord) {word.innerHTML=newWord}
function setError (message) {
    if(message) {
        setTimeout(()=>{
            setError('')
        },1000)
    }
    error.innerHTML=message
}
function addToFound(words){
    foundWords.push(...words)
    updateCounter()
    for(const word of words){
        document.querySelector('.foundWords').insertAdjacentHTML('beforeend', `<word>${word}</word>`)
    }
}
function updateCounter (){
    counter.innerHTML = `${foundWords.length}/${wordsList.length}`
}
function win(){
    document.querySelector('win').style.display='block'
}
function renderLetters(chars, mainChar){
    charGrid.innerHTML=''
    chars.forEach(char =>{
    const el = document.createElement('div')
    el.classList.add('char', String(char) == String(mainChar) ? 'mandatory': 'optional')
    el.innerHTML = char
    el.addEventListener('click',()=>{
        word.innerHTML+= char
    })
    charGrid.append(el)
})
}
function shuffleLetters(chars, mainChar){
    const letters = [...chars]
    const shuffled = chars.map(()=>letters.splice(random(letters.length),1))
    renderLetters(shuffled, mainChar)
}
function random(multiplier){
    return Math.floor(Math.random()*multiplier)
}
async function start(){
    const [chars, mainChar]=chooseChars()
    wordsList = await fetchWords(chars, mainChar)
    if(retry > 0 && !wordsList) {
        loading.innerHTML = 'Tentativa:' +( 30 - retry)
        return start()
    }
    if(!wordsList) return;
    document.querySelector('reference').innerHTML=wordsList.join(' | ')
    updateCounter()
    renderLetters(chars, mainChar)
    enableActions(chars, mainChar, wordsList)
    loading.remove()
}
start()