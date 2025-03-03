module.exports={
    mongooseToObj: function(list){
        return list.map(data=>data.toObject());
    }
}