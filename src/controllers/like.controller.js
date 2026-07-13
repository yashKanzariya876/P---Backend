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

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}