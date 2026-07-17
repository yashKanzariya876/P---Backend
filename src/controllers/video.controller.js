 import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    if(isNaN(pageNumber) || pageNumber < 1 || !Number.isInteger(pageNumber)){
        throw new ApiError(400, "Page must be positive integer")
    }
    if(isNaN(limitNumber) || limitNumber < 1 || !Number.isInteger(limitNumber)){
        throw new ApiError(400, "Limit must be positive integer")
    }

    const matchStage = {
        isPublished: true
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "userId is not valid")
        }

        const user = await User.findById(userId)
        if(!user){
            throw new ApiError(404, "User not found")
        }

        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    if(query?.trim()){
        matchStage.title = {
            $regex: query.trim(),
            $options: "i"
        }
    }
    const allowedSortFields = ["createdAt", "views", "duration", "title"]

    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, "Invalid sort field")
    }

    if (!["asc", "desc"].includes(sortType)) {
        throw new ApiError(400, "sortType must be asc or desc")
    }

    const sortOptions = {
        [sortBy]: sortType === "asc" ? 1 : -1
    }

    const video = Video.aggregate([
        {
            $match: matchStage
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
                            username: 1,
                            fullName: 1,
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
            $sort: sortOptions
        },

    ])

    const options = {
        page: pageNumber,
        limit: limitNumber
    }

    const videos = await Video.aggregatePaginate(
        video,
        options
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Fetch Videos successfully")
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400, "These fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if(!videoFileLocalPath || !thumbnailLocalPath){
        throw new ApiError(500, "File path not found")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile || !thumbnail){
        throw new ApiError(400, "File are required")
    }


    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        duration: videoFile.duration,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, video, "Video Published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "VideoId is not valid")
    }
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Requested video is not found")
    }

    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: {
                views: 1
            }
        },
        {new: true}
    )

    const getVideo = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
            $addFields: {
                likeCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
            }
        },
        {
            $addFields: {
                commentCount: {
                    $size: "$comments"
                }
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
                            username: 1,
                            fullName: 1,
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
                },
            }
        },
        {
            $project: {
                likes: 0,
                comments: 0
            }
        }

    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, getVideo[0], "Get Video successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}