import Task from "../src/models/Task.js";
import User from "../src/models/User.js";
import { apiResponse } from "../utils/apiResponse.js";
import { validationResult } from "express-validator";

// Create task function
export const createTask = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return apiResponse(res, 401, false, "Unauthorized, user not logged in");
    }

    // check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse(res, 400, false, "Validation failed", errors.array());
    }

    // fetch details for task from request body
    const { title, description, tags, priority, status, dueDate } = req.body;
    if (!title || !priority || !status) {
      return apiResponse(res, 400, false, "Please enter all the details");
    }

    // new task object
    const newTask = new Task({
      userId: userId,
      title,
      description,
      tags,
      priority,
      status,
      dueDate,
    });

    // save task in database
    await newTask.save();

    return apiResponse(res, 201, true, "Task added successfully", newTask);
  } catch (error) {
    // error handling
    console.log("Error creating task", error);
    return apiResponse(res, 500, false, "Error creating task");
  }
};

// get task function
export const getTasks = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse(res, 401, false, "Unauthorized, token invalid");
    }

    // fetch tasks from database
    const tasks = await Task.find({ userId: userId }).sort({ createdAt: -1 });
    if (tasks.length == 0) {
      return apiResponse(res, 200, true, "User has no task");
    }
    return apiResponse(res, 200, true, "Tasks fetched successfully", tasks);
  } catch (error) {
    // error handling
    console.log("Error fetching tasks", error);
    return apiResponse(res, 500, false, "Error fetching tasks");
  }
};

// update task function
export const updateTask = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse(res, 401, false, "Unauthorized, token invalid");
    }

    // check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse(res, 400, false, "Validation failed", errors.array());
    }

    // fetch update task details
    const updates = req.body;
    const taskId = req.params.id;

    // fetch task from database and update
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, userId: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updatedTask) {
      return apiResponse(res, 404, false, "Task not found");
    }
    return apiResponse(res, 200, true, "Task updated successfully", updatedTask);
  } catch (error) {
    // error handling
    console.log("Error updating task", error);
    return apiResponse(res, 500, false, "Error updating task");
  }
};

// delete task function
export const deleteTask = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse(res, 401, false, "Unauthorized, token invalid");
    }

    // fetch task id
    const taskId = req.params.id;

    // fetch task to be deleted from database
    const deleteTask = await Task.findOneAndDelete({
      _id: taskId,
      userId: userId,
    });
    if (!deleteTask) {
      return apiResponse(res, 404, false, "Task not found");
    }
    return apiResponse(res, 200, true, "Task deleted successfully");
  } catch (error) {
    // error handling
    console.log("Error deleting task", error);
    return apiResponse(res, 500, false, "Error deleting task");
  }
};

// bulk delete tasks function
export const bulkDeleteTasks = async (req, res) => {
  try {
    // check if user is logged in or not
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse(res, 401, false, "User not logged in");
    }

    // fetch array of task IDs 
    const { ids } = req.body;
    if (!ids || ids.length === 0) {
      return apiResponse(res, 400, false, "No task IDs provided");
    }

    // delete all matching tasks belonging to this user
    await Task.deleteMany({ _id: { $in: ids }, userId: userId });

    return apiResponse(res, 200, true, "Tasks deleted successfully");
  } catch (error) {
    //error handling
    console.log("Error bulk deleting tasks", error);
    return apiResponse(res, 500, false, "Error deleting tasks");
  }
};
