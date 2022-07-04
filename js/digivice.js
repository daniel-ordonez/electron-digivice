
const {ipcRenderer} = require('electron')
const drawDigivice = (parent) => {
    const digivice = new Digivice(parent)
}

class Digivice {
    constructor(parent, size = 300){
        const el = document.createElement('div')
        const buttonA = document.createElement('button')
        const buttonB = document.createElement('button')
        const buttonC = document.createElement('button')
        const screen = document.createElement('div')
        const tokenID = document.createElement('div')
        const tokenValue = document.createElement('div')
        const tokenChange = document.createElement('div')
        const tokenChangePeriod = document.createElement('div')

        el.classList.add('digivice')
        el.height = size
        this.el = el
        parent && parent.appendChild(el)

        buttonA.classList.add('btnA')
        buttonB.classList.add('btnB')
        buttonC.classList.add('btnC')

        this.screen = screen
        screen.classList.add('screen')
        tokenID.classList.add('token-id')
        tokenChange.classList.add('token-change')
        tokenChangePeriod.classList.add('token-change-period')
        tokenValue.classList.add('token-value')
        screen.append(tokenID, tokenChangePeriod, tokenChange, tokenValue)

        this.mode = '24h'
        this.updateScreen = (() => {
            if (!this.record) return
            const {id, value} = this.record
            const change = this.mode24h ? this.record.change24h : this.record.change
            const changePeriod = this.mode24h ? '24h' : 'h'
            tokenID.innerText = id
            tokenChangePeriod.innerText = changePeriod
            tokenChange.innerText = Math.abs(change)
            tokenChange.setAttribute('data-dir', change < 0 ? '▼' : '▲' )
            tokenValue.innerText = value
        })
        this.el.append(buttonA, buttonB, buttonC, screen)
        ipcRenderer.on('updateData', (_, data) => {
            console.log(data)
            const {price, percent_change_1h, percent_change_24h} = data.quote.USD
            const record = {id: data.symbol.substring(0,3), change24h: percent_change_24h.toFixed(2),  change: percent_change_1h.toFixed(2), value: (price/1000).toFixed(2)}
            console.log(record)
            this.record = record
            this.updateScreen()
        })

        buttonA.addEventListener('click', () => this.openBroswer())
        buttonB.addEventListener('click', () => this.toggleModes())
        buttonC.addEventListener('click', () => this.minimize())

        setInterval(()=>{
            ipcRenderer.send('requestData')
        },1000 * 60 * 5)
    }
    openBroswer(){
        let className = 'screen--monster'
        let addClassName = () => !this.screen.classList.contains(className) && this.screen.classList.add(className)
        let removeClassName = () => this.screen.classList.contains(className) && this.screen.classList.remove(className)
        if (this.childWindow && !this.childWindow.closed) {
            this.childWindow.close()
            this.childWindow = null
            removeClassName()
        } else {
            let windowFeatures = "popup=true, noopener=true, noreferrer=true,width=600, height=1080, frame=false"
            let windowObjectReference = window.open('https://coinmarketcap.com/currencies/bitcoin/', '_blank', windowFeatures)
            windowObjectReference.onbeforeunload = event => {
                console.log('child window closed')
                removeClassName()
            }
            this.childWindow = windowObjectReference
            addClassName()
        }
    }
    toggleModes(){
        console.log('toogle')
        this.mode24h = !this.mode24h
        this.updateScreen()
    }
    minimize(){
        ipcRenderer.sendSync('minimize')
    }
}

drawDigivice(document.getElementById('main'))


ipcRenderer.send('requestData')