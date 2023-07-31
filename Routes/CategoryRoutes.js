import express from "express"
import asyncHandler from "express-async-handler"
import { protect, admin } from '../Middleware/AuthMiddleware.js';
import Category from "../Models/CategoryModel.js"

const categoryRouter = express.Router()

// GET ALL CATEGORIES
categoryRouter.get("/", protect, admin, asyncHandler(
    async (req, res) =>
    {
        const categories = await Category.find({});
        res.json(categories);
    })
)

// GET SINGLE CATEGORY 
categoryRouter.get("/:id", asyncHandler(async (req, res) =>
{
    const category = await Category.findById(req.params.id);

    if (category) {
        res.json(category);
    } else {
        res.status(404);
        throw new Error("Category Not Found");
    }
}));

//CREATE CATEGORY
categoryRouter.post("/", protect, admin, asyncHandler(
    async (req, res) =>
    {
        const { name, parent } = req.body
        const categoryExist = await Category.findOne({ name })
        if (categoryExist) {
            res.status(400)
            throw new Error("Category name already exist")
        } else {
            const category = new Category({
                name, parent
            })
            if (category) {
                const createdCategory = await category.save()
                res.status(201).json(createdCategory)
            } else {
                res.status(404)
                throw new Error("Invalid category data")
            }
        }
    }
))

// UPDATE CATEGORY
categoryRouter.put("/:id", protect, admin, asyncHandler(
    async (req, res) =>
    {
        const category = await Category.findById(req.params.id)
        const { name, parent } = req.body
        if (category) {
            category.name = req.body.name || category.name
            category.parent = req.body.parent || category.parent

            const updatedCategory = await category.save()
            res.json(updatedCategory)

        } else {
            res.status(404)
            throw new Error("Category Not Found")
        }
    }
))

// DELETE CATEGORY 
categoryRouter.delete("/:id", protect, admin, asyncHandler(
    async (req, res) =>
    {
        const category = await Category.findById(req.params.id)
        if (category) {
            await category.deleteOne()
            res.json({ message: "Category deleted" })

        } else {
            res.status(404)
            throw new Error("Category Not Found")
        }
    }
))

export default categoryRouter