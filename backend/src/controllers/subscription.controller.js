import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "channelId is not valid")
    }

    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel Not exist")
    }

    if (channel._id.equals(req.user._id)) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const existSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    let isSubscribed

    if(existSubscription){
        await Subscription.findByIdAndDelete(existSubscription._id)
        isSubscribed = false
    }
    else{
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        isSubscribed = true
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isSubscribed}, isSubscribed ? "Channel Subscribed Successfully" : "Channel unSubscribed successfully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "channelId is not valid")
    }
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel Not exist")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
                subscriber: {
                    $first: "$subscriber"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "Get subscribers successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "subscriberId is not valid")
    }

    const subscriber = await User.findById(subscriberId)
    if(!subscriber){
        throw new ApiError(404, "Subscriber Not Exist")
    }

    const getChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
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
                channel: {
                    $first: "$channel"
                }
            }
        },
        {
            $project: {
                channel: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, getChannels, "Get Channels Successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}