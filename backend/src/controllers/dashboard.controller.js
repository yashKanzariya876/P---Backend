import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total views, total subscribers, total videos, total likes etc.
    const likes = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: {
                        $size: "$likes"
                    }
                }
            }
        }
    ])

    const totalLikes = likes[0]?.totalLikes || 0

    const views = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        }
    ])

    const totalViews = views[0]?.totalViews || 0

    const totalSubscribers = await Subscription.countDocuments({
        channel: req.user._id
    })

    const totalVideos = await Video.countDocuments({
        owner: req.user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {totalSubscribers, totalVideos, totalViews, totalLikes}, "Dashboard stastics fetched successfully")
    )
        
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
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
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "All Videos fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }