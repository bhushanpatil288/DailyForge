import Routine from "../src/models/Routine.js";
import User from "../src/models/User.js";
import { apiResponse } from "../utils/apiResponse.js";
import { checkOverlap } from "../utils/routineUtils.js";

// Create routine function
export const createRoutine = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse(res, 401, false, "Unauthorized, user not logged in");
    }

    // fetch routine details from request body
    const { name, description, items } = req.body;
    if (!name || items.length == 0 || !items) {
      return apiResponse(res, 400, false, "Please enter required details");
    }

    // calculate endtime for each task
    const formatted = [];
    for (const item of items) {

      // check duration greater than 10 mins
      if (!item.duration || item.duration < 10) {
        return apiResponse(res, 400, false, "Each task duration must be at least 10 minutes");
      }

      const endTime = item.startTime + item.duration;
      formatted.push({
        day: item.day,
        startTime: item.startTime,
        endTime: endTime,
      });
    }

    // group tasks by day
    const dayGroups = {};
    for (const task of formatted) {
      if (!dayGroups[task.day]) {
        dayGroups[task.day] = [];
      }
      dayGroups[task.day].push(task);
    }

    // loop through each day
    for (const day in dayGroups) {
      const tasks = dayGroups[day];

      // sort tasks by start time
      tasks.sort((a, b) => a.startTime - b.startTime);

      // compare each task with next task
      if (checkOverlap(tasks)) {
        return apiResponse(res, 400, false, `Tasks overlap on ${day}`);
      }
    }

    // create new routine document
    const newRoutine = new Routine({
      userId,
      name,
      description,
      items,
    });

    // save routine in collection
    await newRoutine.save();
    return apiResponse(res, 200, true, "Routine added successfully", newRoutine)
  } catch (error) {
    // error handling
    console.log("Error creating routine", error);
    return apiResponse(res, 500, false, "Error creating routine");
  }
};

// Fetch routine function
export const getRoutines = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse(res, 401, false, "Unauthorized, user not logged in");
    }

    // fetch routines from database
    const routines = await Routine.find({ userId: userId }).sort({
      createdAt: -1,
    });
    if (routines.length == 0) {
      return apiResponse(res, 400, false, "User has no routine");
    }
    return apiResponse(res, 200, true, "Routines fetched successfully", routines);
  } catch (error) {
    // error handling
    console.log("Error fetching routine", error);
    return apiResponse(res, 500, false, "Error fetching routine");
  }
};

// Update routine function
export const updateRoutine = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse(res, 401, false, "Unauthorized, user not logged in");
    }

    // fetch updated routine details
    const updates = req.body;
    const routineId = req.params.id;

    if (updates.items) {
      // calculate endtime for each task
      const formatted = [];
      for (const item of updates.items) {
        const endTime = item.startTime + item.duration;
        formatted.push({
          day: item.day,
          startTime: item.startTime,
          endTime: endTime,
        });
      }

      // group tasks by day
      const dayGroups = {};
      for (const task of formatted) {
        if (!dayGroups[task.day]) {
          dayGroups[task.day] = [];
        }
        dayGroups[task.day].push(task);
      }

      // loop through each day
      for (const day in dayGroups) {
        const tasks = dayGroups[day];

        // sort tasks by start time
        tasks.sort((a, b) => a.startTime - b.startTime);

        // compare each task with next task
        if (checkOverlap(tasks)) {
          return apiResponse(res, 400, false, `Tasks overlap on ${day}`);
        }
      }
    }

    // fetch routine from database and update
    const updatedRoutine = await Routine.findOneAndUpdate(
      { _id: routineId, userId: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updatedRoutine) {
      return apiResponse(res, 404, false, "Routine not found");
    }

    return apiResponse(res, 200, true, "Routine updated successfully", updatedRoutine);
  } catch (error) {
    // error handling
    console.log("Error updating routine", error);
    return apiResponse(res, 500, false, "Error updating routine");
  }
};

// Delete routine function
export const deleteRoutine = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse(res, 401, false, "Unauthorized, user not logged in");
    }

    // fetch routine id
    const routineId = req.params.id;

    // fetch routine to be deleted from database
    const deleteRoutine = await Routine.findOneAndDelete({
      _id: routineId,
      userId: userId,
    });
    if (!deleteRoutine) {
      return apiResponse(res, 404, false, "Routine not found");
    }
    return apiResponse(res, 200, true, "Routine deleted successfully");
  } catch (error) {
    // error handling
    console.log("Error deleting routine", error);
    return apiResponse(res, 500, false, "Error deleting routine");
  }
};
