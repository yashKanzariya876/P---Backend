import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    if (isNaN(pageNumber) || pageNumber < 1) {
        throw new ApiError(400, "Page must be a positive number")
    }

    if (isNaN(limitNumber) || limitNumber < 1) {
        throw new ApiError(400, "Limit must be a positive number")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video is not found")
    }

    const comment = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner:{
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    const options = {
        page: pageNumber,
        limit:limitNumber
    }

    const comments = await Comment.aggregatePaginate(
        comment,
        options
    )    

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "Get Comments Successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {commentContent} = req.body;
    const {videoId} = req.params;
    const owner = req.user._id

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Video is not valid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(!commentContent || !commentContent.trim()){
        throw new ApiError(400, "Comment is required")
    }
    
    

    const comment = await Comment.create({
        content: commentContent.trim(),
        video: videoId,
        owner: owner
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, comment, "Comment is added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {newComment} = req.body

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Comment is not valid")
    }
    
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
    if(!comment.owner.equals(req.user._id)){
        throw new ApiError(403, "Logged in user is not the user")
    }

    if(!newComment || !newComment.trim()){
        throw new ApiError(400, "Comment is required")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: newComment.trim()
            }
        },
        {
            new: true,
            runValidators: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment       
    const {commentId} = req.params

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Comment is not valid")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not exist")
    }

    if(!comment.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to delete this comment")
    }
    
    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Comment deleted Successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}