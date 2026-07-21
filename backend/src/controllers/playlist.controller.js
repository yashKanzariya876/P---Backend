import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400, "name and description are required")
    }
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201, playlist, "Playlist is created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "userId is not valid")
    }

    const getPlaylist  = await Playlist.aggregate([
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
                owner:{
                    $first: "$owner"
                }
            }
        }
    ])
    if(!getPlaylist.length){
        throw new ApiError(404, "User not have any playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, getPlaylist, "Fetched userPlaylist successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "PlaylistId is not valid")
    }
    
    const getPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
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
                owner:{
                    $first: "$owner"
                }
            }
        }
    ])

    if(!getPlaylist.length){
        throw new ApiError(404, "Playlist not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, getPlaylist[0], "Get Playlist successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params                           
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId is not valid")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is not valid")
    }

 
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video Not Exist")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not exist")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "User is not authorized");
    }
    const addToplaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, addToplaylist, "Video added successfully")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId is not valid")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is not valid")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not exist")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "User is not authorized");
    }

    await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId is not valid")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not exist")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "User is not authorized")
    }
    await playlist.deleteOne()

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Playlist Deleted Successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId is not valid")
    }

    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400, "Name and Description required")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not exist")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "User is not authorized")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name.trim(),
                description: description.trim()
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}