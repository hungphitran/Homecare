require('dotenv').config()

function sortByDate(blogs){
    if (!Array.isArray(blogs)) {
        console.error('sortByDate received non-array:', blogs);
        return [];
    }
    return blogs.sort((b1,b2)=>{
        // Add null checks for date comparison
        if (!b1 || !b2) return 0;
        const date1 = b1.date ? new Date(b1.date) : new Date(0);
        const date2 = b2.date ? new Date(b2.date) : new Date(0);
        return date2 - date1; // Changed to descending order (newest first)
    })
}

const blogController ={
    showBlogs: async (req,res,next)=>{
        let blogs=await fetch(process.env.API_URL+'/blog')
        .then(data=>data.json())
        .catch(err=>{
            console.error(err);
            return []; // Return empty array on error
        })
        
        // Check if blogs is array before processing
        if (!Array.isArray(blogs)) {
            console.error('Blogs data is not an array:', blogs);
            blogs = [];
        }
        
        blogs=sortByDate(blogs)
        let tags=[];
        for(let blog of blogs){
            //if this type does not in tags
            if(blog && blog.type && !tags.includes(blog.type)){
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
        .catch(err=>{
            console.error(err);
            return []; // Return empty array on error
        })
        
        // Check if blogs is array before processing
        if (!Array.isArray(blogs)) {
            console.error('Blogs data is not an array:', blogs);
            blogs = [];
        }
        
        let key= req.body.key ? req.body.key.toLowerCase() : '';

        // blogs=blogs.filter((blog,index)=>{
        //     return blog.title.toLowerCase().includes(key)||blog.description.toLowerCase().includes(key)||blog.date.includes(key)
        // })
        // blogs=sortByDate(blogs)

        //get all type of blogs
        let tags = [];
        for(let blog of blogs){
            //if this type does not in tags
            if(blog && blog.type && !tags.includes(blog.type)){
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
        .catch(err=>{
            console.error(err);
            return null; // Return null on error
        })

        //get all blogs have the same type
        let blogs =await fetch(process.env.API_URL+"/blog")
        .then(data=>data.json())
        .catch(err=>{
            console.error(err);
            return []; // Return empty array on error
        })

        // Check if blogs is array and blog exists before filtering
        if (Array.isArray(blogs) && blog && blog.type) {
            blogs = blogs.filter(b=>{
                return b && b.type === blog.type;
            })
        } else {
            blogs = [];
        }

        res.render('pages/detailBlog',{
            blog: blog || {},
            blogs: blogs,
            layout:false
        })
    }
}

module.exports = blogController;