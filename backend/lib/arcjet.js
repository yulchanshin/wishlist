import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node"

import "dotenv/config"

//init arcjet

export const aj = arcjet ({
    key: process.env.ARCJET_KEY,
    characteristics: ["ip.src"],
    rules: [
        //shield protedcts the app from comment attacts like SQL Injection, XSS, etc
        shield({mode:"Live"}),

        //block all the bots except search engines
        detectBot({
            mode:"Live",
            allow: ["CATEGORY:SEARCH_ENGINE"]}

            //you can access the full list at
            //https://arcjet.com/bot-list
        ),

        //rate limiting

        tokenBucket({
            mode:"Live",
            refillRate: 5, 
            interval: 10,
            capacity: 10
        })
    ]
})
