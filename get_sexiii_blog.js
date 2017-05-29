require('events').EventEmitter.prototype._maxListeners = 100;
var steem = require("steem")

steem.config.set('websocket',"wss://ws.golos.io");
steem.config.set('address_prefix',"GLS");
steem.config.set('chain_id','782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12');


const USERID = "sxiii";

var LAST_READ_ID;

async function readHistory() {
    
    //get max histopry  ID 
    let heArr = await steem.api.getAccountHistoryAsync(USERID, -1, 0);
    
    const LAST_ID = heArr[0][0];

    let start = 2001;
    let count = 2000;
    
    while(start <= LAST_ID) {
        console.log("start = " + start + " count = " + count);
        let heArr = await steem.api.getAccountHistoryAsync(USERID, start, count);
        filterAccountHistory(heArr);
        
        if(start == LAST_ID) {
            break;
        } else if(start + count > LAST_ID) {
            count = LAST_ID - start;
            start = LAST_ID;
        } else {
            start += count;
        }
    }
    
    console.log("найдено постов " + PERMLINKS.length);
    
    process.exit(0);
}

async function filterAccountHistory(heArr) {

    for(let i = 0; i < heArr.length; i++) {
        let he = heArr[i];
        let id = he[0];
        if(id <= LAST_READ_ID) {
            continue; //что бы не заморачиваться с математикой индексов и не читать повторно
        }
        LAST_READ_ID = id;
        
        let tr = he[1];
        
        processTransaction(tr);
    }
}

var PERMLINKS = [];

async function processTransaction(tr) {
    /*
        * tr.block
        * tr.timestamp
        * tr.op[0] //имя операции
        * tr.op[1] //операция
        */

    let op = tr.op[0];
    let opBody = tr.op[1];
    if(op == "comment" && opBody.parent_author == "") {
   
        if(PERMLINKS.includes(opBody.permlink)) {
            //редактирование поста, игнорируем
            //console.log("редактирование " + opBody.permlink);
            return;
        }
        PERMLINKS.push(opBody.permlink);
        
        //Получаем контент
        let content = await steem.api.getContentAsync(opBody.author, opBody.permlink);
        if(content.permlink == opBody.permlink) {
            console.log(`[${content.title}](https://golos.io/@${content.author}/${content.permlink} | ${content.total_payout_value}`);
        }
    }
}

readHistory();
