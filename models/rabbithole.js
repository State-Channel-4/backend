/*
RabbitHole document implementation
RabbitHole_name : [head_url_id, 2nd_url_id, ...,  tail_url]
{
    title: "RabbitHole1",
    list: [url_id1, url_id2, ...] 
    insert_op : O(1),
    delete_op : O(n) // search and delete
    update_op : O(n) // search and update
}

*/
const mongoose = require('mongoose')

const RabbitHoleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    rabbithole_list : {
        type: [mongoose.Types.ObjectId],
        ref: 'Url',
        unique: true
    }

})

const RabbitHole = mongoose.model('RabbitHole', RabbitHoleSchema)

module.exports = {
    RabbitHole: RabbitHole
};