import express from 'express';
import asyncHandler from "express-async-handler";
import { admin, protect } from '../Middleware/AuthMiddleware.js';
import Product from '../Models/ProductModel.js';

const productRoute = express.Router()

//GET ALL PRODUCT
productRoute.get("/", asyncHandler(
    async (req,res) => {
        const pageSize = 4
        const page = Number(req.query.pageNumber) || 1
        const keyword = req.query.keyword ? {
            name: {
                $regex: req.query.keyword,
                $options: "i"
            }
        } : {}
        const count = await Product.countDocuments({...keyword})
        const products = await Product.find({...keyword}).limit(pageSize).skip(pageSize * (page - 1))
            .sort({_id: -1})
        res.json({products, page, pages: Math.ceil(count / pageSize)})
    }
))

// ADMIN GET ALL PRODUCT WITHOUT SEARCH AND PAGINATION
productRoute.get("/all", protect, admin, asyncHandler(async (req,res) => {
    const products = await Product.find({}).sort({_id: -1})
    res.json(products)
}))

//GET SINGLE PRODUCT
productRoute.get("/:id", asyncHandler(
    async (req,res) => {
        const product = await Product.findById(req.params.id)
        if (product) {
            res.json(product)
        } else {
            res.status(404)
            throw new Error("Product Not Found")
        }
    }
))

//PRODUCT REVIEW
productRoute.post("/:id/review", protect, asyncHandler(
    async (req,res) => {
        const { rating, comment } = req.body 
        const product = await Product.findById(req.params.id)
        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            )
            if (alreadyReviewed) {
                res.status(400)
                throw new Error("Product already reviewed")
            }
            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id
            }
            product.reviews.push(review)
            product.numReviews = product.reviews.length
            product.rating = product.reviews.reduce((acc,item) => item.rating + acc, 0) / product.reviews.length

            await product.save()
            res.status(201).json({message: "Reviewed Added"})
        } else {
            res.status(404)
            throw new Error("Product Not Found")
        }
    }
))

//DELETE PRODUCT
productRoute.delete("/:id", protect, admin, asyncHandler(
    async (req,res) => {
        const product = await Product.findById(req.params.id)
        if (product) {
            await product.deleteOne()
            res.json({ message: "Product deleted"})
        } else {
            res.status(404)
            throw new Error("Product Not Found")
        }
    }
))

//CREATE PRODUCT
productRoute.post("/", protect, admin, asyncHandler(
    async (req,res) => {
        const { name, price, description, image, countInStock, color, category } = req.body
        const productExist = await Product.findOne({name})
        if (productExist) {
            res.status(400)
            throw new Error("Product name already exist")
        } else {
            const product = new Product({
                name, price, description, image, countInStock, color, category,
                user: req.user._id
            })
            if (product) {
                const createdproduct = await product.save()
                res.status(201).json(createdproduct)
            } else {
                res.status(404)
                throw new Error("Invalid product data")
            }
        }
    }
))

//CREATE PRODUCT
// productRoute.post("/", protect, admin, asyncHandler(
//     async (req,res) => {
//         const { name, price, description, image, countInStockS, countInStockM, countInStockL, countInStockXL, color, category } = req.body
//         const productExist = await Product.findOne({name})
//         if (productExist) {
//             res.status(400)
//             throw new Error("Product name already exist")
//         } else {
//             const productS = new Product({
//                 name,
//                 price,
//                 description,
//                 image,
//                 size: 'S',
//                 countInStock: countInStockS,
//                 color,
//                 category,
//                 user: req.user._id
//             });
//             await productS.save();
            
//             const productM = new Product({
//                 name,
//                 price,
//                 description,
//                 image,
//                 size: 'M',
//                 countInStock: countInStockM,
//                 color,
//                 category,
//                 user: req.user._id
//             });
//             await productM.save();
            
//             const productL = new Product({
//                 name,
//                 price,
//                 description,
//                 image,
//                 size: 'L',
//                 countInStock: countInStockL,
//                 color,
//                 category,
//                 user: req.user._id
//             });
//             await productL.save();

//             const productXL = new Product({
//                 name,
//                 price,
//                 description,
//                 image,
//                 size: 'XL',
//                 countInStock: countInStockXL,
//                 color,
//                 category,
//                 user: req.user._id
//             });
//             await productXL.save();

//             res.status(201).json({ message: 'Product added successfully' });
//         }
//     }
// ))

// UPDATE PRODUCT
productRoute.put("/:id", protect, admin, asyncHandler(
    async (req,res) => {
        const { name, price, description, image, countInStock, color, category } = req.body
        const product = await Product.findById(req.params.id)
        if (product) {
            product.name = name || product.name
            product.price = price || product.price
            product.description = description || product.description
            product.image = image || product.image
            product.countInStock = countInStock || product.countInStock
            product.color = color || product.color
            product.category = category || product.category

            const updatedProduct = await product.save()
            res.json(updatedProduct)
        } else {
            res.status(404)
            throw new Error("Product Not Found")
        }
    }
))

export default productRoute