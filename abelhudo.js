const loadingPhrases = [
    "procurando as letras",
    "se preparando para pousar",
    "cheirando flores",
    "voando para a colmeia",
    "preparando o mel",
    "trabalhando",
    "carregando o pólen",
    "coletando néctar",
    "lendo um livro",
    "arrumando a colmeia",
    "juntando as palavras"
];
function select(query) {
    return document.querySelector(query)
}
function selectAll(query) {
    return document.querySelectorAll(query)
}
const word = select('#word')
const charGrid = select('.charGrid')
const error = select('error')
const loading = select("loading")
const counter = select('#counter')
const tierRange = select('#tierRange')
const reference = select('reference')
const local = window.location.protocol === 'file:'
const wordsListUrl = local ? 'https://www.ime.usp.br/~pf/dicios/br-utf8.txt' : 'br-utf8.txt'
let foundWords = []
let totalLetters =  0
let letterScore =  0
let tiers = []
let currentTier = localStorage.getItem("currentTier") ?? "Iniciante";
let currentTierIndex = Number(localStorage.getItem("currentTierIndex") ?? 0) ?? 0;
const MAX_RETRIES = loadingPhrases.length * 3;
let retry = MAX_RETRIES
const MIN_WORDS = 5
const MAX_WORDS = 10
const allChars = ["a", "ã", "b", "c", "ç", "d", "e", "f", "g", "h", "i", "j", "l", "m", "n", "o", "õ", "p", "q", "r", "s", "t", "u", "v", "x", "z"]
const charMap = {
    a: 'aáâ',
    e: 'eéê',
    i: 'ií',
    o: 'oóô',
    u: 'uúü'
}
const keepGameStorage = localStorage.getItem("keepGame");
let keepGame = JSON.parse(keepGameStorage ?? true);

function chooseChars() {
    const alternatives = [...allChars]
    const chars = Array(7)
        .fill()
        .map(() => {
            const chosen = alternatives.splice(random(alternatives.length - 1), 1)
            return chosen
        })

    const mainChar = chars[random(chars.length - 1)]
    return [chars, mainChar]
}

function createRegex(chars, mainChar) {
    const charsRegex = chars.map(char => charMap[char] ?? char).join('')
    const mainCharRegex = charMap[mainChar] ?? mainChar
    return new RegExp(`^(?=[${charsRegex}]*${mainCharRegex}+)[${charsRegex}]{4,}$`, 'gim')
}

function filterWords(wordsFile, chars, mainChar) {
    const wordRegex = createRegex(chars, mainChar)
    const filteredWords = wordsFile.match(wordRegex)
    if (filteredWords?.length < MAX_WORDS &&
        filteredWords?.length > MIN_WORDS) {
        return filteredWords.map(word => word.toLowerCase())
    }
    retry--
}

function sanitize(str) {
    return str
        .replace(/[áâ]/g, "a")
        .replace(/[éê]/g, "e")
        .replace(/[í]/g, "i")
        .replace(/[óõô]/g, "o")
        .replace(/[ú]/g, "u")
}

function validateWord(word, mainChar, wordsList) {
    if (!word || !word.length || word.length <= 3) throw new Error("A palavra precisa ser maior.")

    if (!word.includes(mainChar)) throw new Error("Não possui a letra obrigatória.")
    const wordsToAdd = wordsList.filter(w => {
        return sanitize(w) === word.toLowerCase()
    })
    if (foundWords.filter(word => wordsToAdd.includes(word)).length) throw new Error("Palavra já encontrada")
    if (!wordsToAdd.length) throw new Error('Palavra não encontrada.')
    return wordsToAdd
}

function closeModals(){
    selectAll(".modal").forEach((item) => {
        item.classList.remove("show")
    })
}

function showModal(selection){
    select(selection).classList.add("show")
}

function clearData(){
        localStorage.removeItem("chars")
        localStorage.removeItem("mainChar")
        localStorage.removeItem("currentTierIndex")
        localStorage.removeItem("currentTier")
        localStorage.removeItem("foundWords"),
        localStorage.removeItem("letterScore")
    }

function enableActions(chars, mainChar, wordsList) {

    select("#config").addEventListener("click", () => {
        closeModals()
        showModal("config")
    })

    select("#new").addEventListener("click", () => {
        clearData();
        window.location.assign('/');
    })

    select("#keepGame input").addEventListener('change', (e) => {
        if(e.target.checked){
            localStorage.setItem("chars", chars.join(''))
            localStorage.setItem("mainChar", mainChar)
            localStorage.setItem("currentTierIndex", currentTierIndex),
            localStorage.setItem("currentTier", currentTier)
            localStorage.setItem("foundWords", JSON.stringify(foundWords)),
            localStorage.setItem("letterScore", letterScore)
        }else{
            clearData()
        }
        keepGame = e.target.checked;
        localStorage.setItem("keepGame", JSON.stringify(e.target.checked))
    })

    selectAll("#share").forEach(item => {
        item.addEventListener('click', () => {
            const sortedChars = chars.sort((a) => a == mainChar ? 1 : -1).join('');
            const shareText = `Fiz ${letterScore} pontos com ${foundWords.length} palavras e cheguei ao nível "${currentTier}"! Até onde você consegue chegar?`;
            const shareUrl = `https://abelhando.site/?letras=${sortedChars}`;
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}%20${encodeURIComponent(shareUrl)}`;
            window.location.href = whatsappUrl;
        });
    })

    selectAll(".modal .share").forEach(item => {
        item.addEventListener('click', () => {
            const dataText = "Dê uma olhada nesse jogo! Forme palavras para alcançar o maior nível.";
            const shareUrl = 'https://abelhando.site';
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(dataText)}%20${encodeURIComponent(shareUrl)}`;
            window.location.href = whatsappUrl;
        });
    })

    select('#enter').addEventListener('click', () => {
        const candidateWord = word.innerHTML
        try {
            const wordsFound = validateWord(candidateWord, mainChar, wordsList)
            const lettersFound = countLetters(wordsFound)
            addToFound(wordsFound, lettersFound)
            updateScore(wordsList, lettersFound)
        } catch (error) {
            setError(error.message)
        } finally {
            setWord('')
        }
    })

    select('#delete').addEventListener('click', () => {
        const currentWord = word.innerHTML
        setWord(currentWord.substring(0, currentWord.length - 1))
    })

    select('#reset').addEventListener('click', () => {
        setWord('')
    })

    select('#shuffle').addEventListener('click', () => {
        shuffleLetters(chars, mainChar)
    })

    counter.addEventListener('click', () => {
        reference.classList.toggle('show')
    })
    select("#help").addEventListener("click", () => {
        showModal("help.modal");
    })

    selectAll("#close").forEach(item => {
        item.addEventListener("click", () => {
            closeModals()
        })
    })

    select("#counters").addEventListener("click", () => {
        selectAll(".modal").forEach(item => {
            item.classList.remove("show");
        })
        showModal("tiers.modal")
    })
}

function updateScore(wordsList, lettersFound) {
    updateCounter(wordsList)
    renderScore(lettersFound)
    const [label, index] = tiers.reduce((final, [k, v], i) => {
        if (letterScore >= v) return [k, i]
        return final
    }, [currentTier, currentTierIndex])
    currentTier = label;
    currentTierIndex = index
    if(keepGame){
        localStorage.setItem("currentTierIndex", currentTierIndex),
        localStorage.setItem("currentTier", currentTier)
    }
    select('#tierLabel').innerHTML = label
    select('tier').style.width = Math.ceil(letterScore / totalLetters * 100) + '%'
    select('tier, next').classList.remove('active')
    select('tier, next').classList.add('active')

    if (foundWords.length === wordsList.length) {
        return win()
    }
    select('next').style.width = Math.ceil(tiers[currentTierIndex + 1][1] / totalLetters * 100) + '%'

}

function setWord(newWord) {
    word.innerHTML = newWord
}

function setError(message) {
    if (message) {
        setTimeout(() => {
            setError('')
        }, 1000)
    }
    error.innerHTML = message
}

function addToFound(words, lettersFound) {
    foundWords.push(...words)
    letterScore += lettersFound
    if(keepGame){
        localStorage.setItem("foundWords", JSON.stringify(foundWords))
        localStorage.setItem("letterScore", letterScore)
    }
    for (const word of words) {
        select('.foundWords').insertAdjacentHTML('beforeend', `<word>${word}</word>`)
    }
}

function updateCounter(wordsList) {
    select('#letters').innerHTML = `${letterScore}/${totalLetters}`
    counter.innerHTML = `${foundWords.length}/${wordsList.length}`
}

function getTiers(count) {
    const calc = x => Math.floor(count * x)
    return [
        ['Iniciante', 0],
        ['Mediano', Math.max(3, calc(0.05))],
        ['Bom', Math.max(6, calc(0.1))],
        ['Ótimo', Math.max(9, calc(0.3))],
        ['Excelente', Math.max(12, (calc(0.5)))],
        ['Dominante', Math.max(15, calc(0.8))],
        ['Genial', Math.max(20, calc(1))]
    ]
}

function renderScore(letters) {
    const score = document.createElement("score")
    score.innerHTML = '+' + letters
    select("#tiers").append(score)
    setTimeout(() => {
        score.remove()
    }, 1000)
}

function win() {
    showModal("win.modal")
}

function renderLetters(chars, mainChar) {
    charGrid.innerHTML = ''
    chars.forEach(char => {
        const el = document.createElement('div')
        el.classList.add('char', String(char) == String(mainChar) ? 'mandatory' : 'optional')
        el.innerHTML = char
        el.addEventListener('click', () => {
            word.innerHTML += char
        })
        charGrid.append(el)
    })
}

function shuffleLetters(chars, mainChar) {
    const letters = [...chars]
    const shuffled = chars.map(() => letters.splice(random(letters.length), 1))
    renderLetters(shuffled, mainChar)
}

function random(multiplier) {
    return Math.floor(Math.random() * multiplier)
}

function countLetters(words) {
    return words.reduce((total, word) => {
        const count = word.length === 4 ? 1 : word.length
        return total + count;
    }, 0)
}

function setup(wordsFile) {
    const [chars, mainChar] = getParamsChars() ?? getStorageChars() ?? chooseChars()
   
    const wordsList = filterWords(wordsFile, chars, mainChar);
    if (retry > 0 && !wordsList) {
        const retryPhrase = Math.floor(Math.random() * loadingPhrases.length)
        select('#retries').innerHTML = "... as abelhas estão " + loadingPhrases[retryPhrase] + " ...";
        setTimeout(() => {
            setup(wordsFile)
        }, Math.max(200, Math.random() * 400))
        return
    }
    if (!wordsList || !wordsList.length) {
        return showLoadingError()
    };
    if(keepGame){
        localStorage.setItem("chars", chars.join(''))
        localStorage.setItem("mainChar", mainChar)
    }
    totalLetters = countLetters(wordsList)
    renderLetters(chars, mainChar)
    enableActions(chars, mainChar, wordsList)
    tiers = getTiers(totalLetters)
    const localFoundWords = localStorage.getItem('foundWords');
    if(localFoundWords){
        const words = JSON.parse(localFoundWords);
        const lettersFound = countLetters(words)
        addToFound(words, lettersFound) 
        updateScore(wordsList, lettersFound)
    } 
    updateCounter(wordsList)
    setHelpTiers(tiers)
    select('reference').innerHTML = wordsList.join(' | ')
    select("#tierLabel").innerHTML = currentTier;
    if(!currentTierIndex >= tiers.length){
        select('next').style.width = Math.ceil(tiers[currentTierIndex+1][1] / totalLetters * 100) + '%'
    }
    loading.remove()
    showHelpOnEnter()
}

function setHelpTiers() {
    const helpTiers = select("#helpTiers");
    tiers.map(([tier, points]) => {
        const tierElement = document.createElement('li');
        tierElement.innerHTML = `<div class="tier">${tier}</div><div class="points">${points}</div>`
        helpTiers.append(tierElement)
    })

}

function showLoadingError() {
    select('#retries').innerHTML = "Sinto muito! Tente novamente mais tarde."
    loading.classList.add('failed')
    return;
}

async function start() {
    const wordsFile = await fetch(wordsListUrl).then(x => x.text()).catch(() => {
        return showLoadingError()
    })

    select("#keepGame input").checked = keepGame;
    setup(wordsFile)

}

function getParamsChars(){
    const query = window.location.search;
    const urlParams = new URLSearchParams(query);
    const chars = urlParams.get("letras")
    if(!chars || chars?.length != 7) return

    clearData()
    return [chars.split(''), chars.split('').at(-1)]
}

function getStorageChars(){
    if(!keepGame) return;
    const chars = localStorage.getItem("chars")
    const mainChar = localStorage.getItem("mainChar")
    
    if(!chars || chars?.length != 7 || !mainChar) return;

    return [chars.split(''), mainChar]
}

function showHelpOnEnter() {
    const activeUser = localStorage.getItem("activeUser")
    if (!activeUser) {
        select("help").classList.add("show")
        localStorage.setItem("activeUser", "true")
    }
}

start()
