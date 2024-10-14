require('dotenv').config()

function sortByDate(blogs){
    return blogs.sort((b1,b2)=>{
        return b1.date - b2.date;
    })
}

const blogController ={
    showAll: async (req,res,next)=>{
        let blogs=await fetch(process.env.API_URL+'/blog')
        .then(data=>data.json())
        .catch(err=>console.error(err))
        blogs=sortByDate(blogs)
        res.render('pages/blog',{
            blog:blogs,
            layout:false
        })
    },
    filter: async(req,res,next)=>{
        let blogs=await fetch(process.env.API_URL+'/blog')
        .then(data=>data.json())
        .catch(err=>console.error(err))
        let key= req.body.key.toLowerCase()

        blogs=blogs.filter((blog,index)=>{
            return blog.title.toLowerCase().includes(key)||blog.description.toLowerCase().includes(key)||blog.date.includes(key)
        })
        blogs=sortByDate(blogs)

        res.render('pages/blog',{
            key:key,
            blog:blogs,
            layout:false
        })
    },
    showOne: async (req,res,next)=>{
        let blog=await fetch(process.env.API_URL+"/blog/"+req.params.id)
        .then(data=>data.json())
        .catch(err=>console.error(err))

        res.render('pages/detailBlog',{
            blog:blog,
            layout:false
        })
    }
}

module.exports = blogController;