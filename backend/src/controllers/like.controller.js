import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "VideoId is not valid")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video Not Found")
    }

    const likedById = req.user._id
    const liked = await Like.findOne({
        video: videoId,
        likedBy: likedById
    })

    let isLiked

    if(!liked){
        await Like.create({
            video: videoId,
            likedBy: likedById
        })
        isLiked = true
    }

    else{
        await Like.findByIdAndDelete(liked._id)
        isLiked = false 
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked}, isLiked ? "Video Liked Successfully" : "Video Unliked Successfully")
    )
    
})
 
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "CommentId is not valid")
    }
    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment Not Exist")
    }

    const liked = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    let isLiked

    if(!liked){
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        isLiked = true
    }
    else{
        await Like.findByIdAndDelete(liked._id)
        isLiked = false
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked}, isLiked ? "Comment is liked successfully" : "Comment is unliked successfully")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400, "TweetId is not valid")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not Exist")
    }
    const liked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    let isLiked

    if(!liked){
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        isLiked = true
    }
    else{
        await Like.findByIdAndDelete(liked._id)
        isLiked = false
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked}, isLiked ? "Tweet is liked successfully" : "Tweet is unliked successfully")
    )

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const liked = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: {$exists: true}
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
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
                        },
                        
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            },
        },
        {
            $addFields: {
                video:{
                    $first: "$video"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, liked, "Liked Videos Fetched Successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}