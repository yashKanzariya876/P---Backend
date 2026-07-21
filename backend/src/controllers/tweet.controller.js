import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if(!content || !content.trim()){
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, tweet, "Tweet is created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "userId is not valid")
    }
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(404, "User Not Found")
    }

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
                owner: {
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

    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweet, "User tweets fetched successfully")
    )


})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params

    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400, "tweetId is not valid")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet Not Found")
    }

    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(403, "Logged in user not authorized to update Tweet")
    }

    const {content} = req.body
    if(!content || !content.trim()){
        throw new ApiError(400, "Content is not given")
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content.trim()
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, newTweet, "Tweet is updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "tweetId is not valid")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet is not found")
    }

    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(403, "Logged in user is not authorized to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Tweet is deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}