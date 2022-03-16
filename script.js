const mda = require("./MDA SPA.postman_collection.json");
const axios = require("axios")

const filePath = "mda.md"

const fs = require("fs")

async function appendToFile(data) {
    return new Promise((done, reject) => {
        fs.appendFile(filePath, data, (e) => {
            if (!e) done()
            reject(e)
        });
    })
}

async function writeFile(data) {
    return new Promise((done, reject) => {
        fs.writeFile(filePath, data, (e) => {
            if (!e) done()
            reject(e)
        });
    })
}

const variable = {};
mda.variable.map(a => variable[a.key] = a.value)

const a = "{{iviva_server_url}}/Lucy/ParkingOperator/operator/{{parking_operator_id}}"
const CURLtemplate = (method, requestLink, bodyData, apikey) => `
    curl --location --request ${method} '${requestLink}' \\
    --header 'Authorization: APIKEY ${apikey}' \\
    --header 'Content-Type: application/json' \\${bodyData ? `\n\t--data-raw '${bodyData}'` : ""}
`
const extractVariables = (inputString, match, newStr) => {
    let result = inputString?.match(/\{\{\w+\}\}/g) || [];
    result.forEach(str => {
        let prop = str.replaceAll(/\{\{|\}\}/g, "")
        inputString = inputString?.replaceAll(str, variable[prop]);
    })
    inputString = inputString?.replaceAll(match, newStr);
    return inputString;
}

const itemWrite = async (item) => {
    if (item?.request) {
        await appendToFile(`1. ${item["name"]} \n\n`)
        await appendRequest(item.request)
    } else {
        await appendToFile(`## ${item["name"]} \n\n`)
    }
    if (!item?.item) return;

    for (let eachItem of item?.item) {
        await itemWrite(eachItem);
    }
}

const formMarkdown2 = async () => {
    try {
        await writeFile("")
        for (const item of mda.item) {
            await itemWrite(item)
        }
    }
    catch (e) {
        // console.log(e);
    }
}


const appendRequest = async (request) => {
    // console.log(request)
    const body = extractVariables(request?.body?.raw, "\n", "\n\t")
    const requestLink = extractVariables(request?.url?.raw)
    await appendToFile("\n\t**Request**\n")
    await appendToFile("\n\t```json" + CURLtemplate(request.method, requestLink, body, variable["apikey"]) + "\t```\n")
    // fetch/
    try{
        
        const { data } = await axios({
            method: request.method,
            url: requestLink,
            data: body,
            headers: {
                'Authorization': `APIKEY ${variable["apikey"]}`,
                'Content-Type': 'application/json'
            },
            
        })
        await appendToFile("\n\t**Response**\n")
        await appendToFile("\n\t```json\n\t" + JSON.stringify(data,"", 2).replaceAll("\n", "\n\t") + "\n\t```\n")
    }catch(e){
        // console.log
    }
}

formMarkdown2()

