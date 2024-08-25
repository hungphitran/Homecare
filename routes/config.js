function route(app){
    app.use('/',(req,res)=>{
        res.send('Hello world')
        // res.render('<h1>dashboard</h1>')
    })
}

module.exports={route}