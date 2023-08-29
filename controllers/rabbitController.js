// Models
const { Url } = require('../models/schema');
const { RabbitHoleModel } = require("../models/rabbithole")


// create rabbithole function
const create_rabbithole = async(req, res) => {
    const {title} = req.body
    try {
        const rabbithole = await RabbitHoleModel.create({title: title})
        return res.status(200).json(rabbithole)
    } catch(error) {
        return res.status(500).json({error : error.message})
    }
}

// insert url into rabbithole, if already exists return 
// also check if rabbithole with title exists or not. if not create rabbithole with title
const insert_url_into_rabbithole = async(req, res) => {
    const {url, rabbithole_title} = req.body
    try {
        let rabbithole = await RabbitHoleModel.findOne({title: rabbithole_title})
        if(!rabbithole) {
            rabbithole = await RabbitHoleModel.create({title: rabbithole_title})
        }
        // get url id from url
        const url_id = await Url.findOne({url: url})
        // insert into rabbithole list 
        rabbithole.rabbithole_list.push(url_id)
        await rabbithole.save()
        return res.status(200).json(rabbithole)
    } catch(error) {
        return res.status(500).json({error : error.message})

    }
}