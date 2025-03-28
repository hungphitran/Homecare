require('dotenv').config()

function sortByDate(blogs){
    return blogs.sort((b1,b2)=>{
        return b1.date - b2.date;
    })
}

const blogController ={
    showBlogs: async (req,res,next)=>{
        let blogs=await fetch(process.env.API_URL+'/blog')
        .then(data=>data.json())
        .catch(err=>console.error(err))
        blogs=sortByDate(blogs)
        let tags=[];
        for(let blog of blogs){
            //if this type does not in tags
            if(!tags.includes(blog.type)){
                tags.push(blog.type)
            }
        }
        res.render('pages/blog',{
            tags:tags,
            blogs:blogs,
            layout:false
        })
    },
    filter: async(req,res,next)=>{
        let blogs=await fetch(process.env.API_URL+'/blog')
        .then(data=>data.json())
        .catch(err=>console.error(err))
        let key= req.body.key.toLowerCase()

        // blogs=blogs.filter((blog,index)=>{
        //     return blog.title.toLowerCase().includes(key)||blog.description.toLowerCase().includes(key)||blog.date.includes(key)
        // })
        // blogs=sortByDate(blogs)

        //get all type of blogs
        let tags = [];
        for(let blog of blogs){
            //if this type does not in tags
            if(!tags.includes(blog.type)){
                tags.push(blog.type)
            }
        }
        res.render('pages/blog',{
            key:key,
            blog:blogs,
            tags:tags,
            layout:false
        })
    },
    showOne: async (req,res,next)=>{
        let blog=await fetch(process.env.API_URL+"/blog/"+req.params.id)
        .then(data=>data.json())
        .catch(err=>console.error(err))

        //get all blogs have the same type
        let blogs =await fetch(process.env.API_URL+"/blog")
        .then(data=>data.json())
        .catch(err=>console.error(err))

        blogs = blogs.filter(b=>{
            return b.type===blog.type;
        })

        res.render('pages/detailBlog',{
            blog:blog,
            blogs:blogs,
            layout:false
        })
    }
}

module.exports = blogController;