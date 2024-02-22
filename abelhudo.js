const word = document.querySelector('#word')
const charGrid = document.querySelector('.charGrid')
const error = document.querySelector('error')
const loading = document.querySelector("loading")
const counter = document.querySelector('#counter')
const tierRange = document.querySelector('#tierRange')
const reference = document.querySelector('reference')
function select(query){
    return document.querySelector(query)
}
const local = window.location.protocol === 'file:'
console.log(local)
const wordsListUrl = local ? 'https://www.ime.usp.br/~pf/dicios/br-utf8.txt' : 'br-utf8.txt'
let foundWords = []
let totalLetters = 0
let foundLetters = 0
let tiers = []
const MAX_RETRIES = 50
let retry = MAX_RETRIES
const MIN_WORDS = 20
const MAX_WORDS = 50
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
        if(filteredWords?.length < MAX_WORDS && filteredWords?.length > MIN_WORDS ) return filteredWords.map(word=>word.toLowerCase())
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
    const [label, index] = tiers.reduce((final, [k,v], i) => {
        if(foundLetters >= v) return [k, i]
        return final
    }, ['Iniciante', 0])
    select('#tierLabel').innerHTML = label
    select('tier').style.width = Math.ceil(foundLetters / totalLetters * 100) + '%'
    select('tier, next').classList.remove('active')
    select('tier, next').classList.add('active')
    if(foundWords.length === wordsList.length){
       return win()
    }
    select('next').style.width = Math.ceil(tiers[index + 1][1]/totalLetters * 100) + '%'
    
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
    foundLetters += countLetters(words)
    updateCounter()
    for(const word of words){
        document.querySelector('.foundWords').insertAdjacentHTML('beforeend', `<word>${word}</word>`)
    }
}

function updateCounter (){
    select('#letters').innerHTML=`${foundLetters}/${totalLetters}`
    counter.innerHTML = `${foundWords.length}/${wordsList.length}`
}

function getTiers(count){
    const calc = x => Math.floor(count * x)
    return [
        ['Iniciante', 0],
        ['Mediano', Math.max(3, calc(0.05))],
        ['Bom', Math.max(6,calc(0.1))],
        ['Ótimo', Math.max(9,calc(0.3))],
        ['Excelente', Math.max(12,(calc(0.5)))],
        ['Dominante', Math.max(15,calc(0.8))],
        ['Genial', Math.max(20, calc(1))]
    ]
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
function countLetters(words){
   return words.reduce((total, word)=>{
        const count = word.length === 4 ? 1 : word.length
        return total + count;
    }, 0)
}
async function start(){
    const [chars, mainChar]=chooseChars()
    wordsList = await fetchWords(chars, mainChar)
    if(retry > 0 && !wordsList) {
        loading.innerHTML = 'Tentativa:' + (MAX_RETRIES - retry)
        return start()
    }
    if(!wordsList) return;
    
    totalLetters = countLetters(wordsList)
    renderLetters(chars, mainChar)
    enableActions(chars, mainChar, wordsList)
    tiers = getTiers(totalLetters)
    console.log(tiers[1][1])
    document.querySelector('reference').innerHTML=wordsList.join(' | ')
    select('next').style.width = Math.ceil(tiers[1][1]/totalLetters * 100) + '%'
    updateCounter()
    loading.remove()
}
start()