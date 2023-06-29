const PORT = process.env.PORT || 8000 //gives option of port for deployment
const express = require("express") // backend framework for node JS, executes code and listens to code
const axios = require("axios") // Will allow for the api functionalities such as put, get, delete, post
const cheerio = require("cheerio") // used to scrap web page
const { response } = require("express")

const app = express()

const url = 'https://www.worldfootball.net/players_list/eng-premier-league-2023-2024/nach-name/'
const urlPlayer = 'https://www.worldfootball.net'

function getAge(dateString) {
    let date = dateString.split("/") 
    var today = new Date();
    //var birthDate = new Date(dateString);
    var birthDate = new Date(parseInt(date[2]), parseInt(date[1]) - 1, parseInt(date[0]));
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

let players = []
const pages = 13
let pidCounter = 1

for (let page = 1; page < pages; page++){
    axios.get(url + `${page}/`)
        .then((response) => {
            const html = response.data
            const $ = cheerio.load(html)
            //find the element with the class standard_table, then find the tr elements attached to it
            $('.standard_tabelle').find('tr').each(function (){
                //if the tr element has player info, it will have 6 td elements
                if ($(this).find('td').length === 6){
                    const playerInfo = $(this).find('td')
                    // use eq funciton to access the specific element out of all the elements matching the search criteria
                    const playerName = playerInfo.eq(0).text()

                    //make another call to their profile to collect their nation
                    axios.get(urlPlayer + playerInfo.eq(0).find('a').attr('href')).then((response) => {
                        const html = response.data
                        const $ = cheerio.load(html)
                    
                        const playerNation = $('span[itemprop="nationality"]').text()
                        //console.log(playerNation)
                        if (!playerInfo.eq(4).text().includes("?")){
                            players.push({
                                pid: pidCounter,
                                name: playerName.trim(),
                                logo: playerInfo.eq(1).find('img').attr('src'),
                                team: playerInfo.eq(2).text(),
                                age: getAge(playerInfo.eq(3).text()),
                                height: parseInt(playerInfo.eq(4).text().replace(" cm", "")),
                                position: playerInfo.eq(5).text(),
                                nation: playerNation
                            })
                            pidCounter++;
                        }
                        
                    }).catch((err) => console.log(err))        
                }
            })
            
        }).catch((err) => console.log(err))
}


//On the home page ('/') of the app, when recieve a request give a response of the string below
app.get('/', (req, res) => {
    res.json("Welcome to my Premier League Player API")
})

app.get('/players', (req, res) => {
    res.json(players)  // give a response to the webpage of the current array of players
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))