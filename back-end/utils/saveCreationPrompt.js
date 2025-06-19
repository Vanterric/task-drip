
const mongoose = require('mongoose');
const TaskList = require('../models/TaskList');


const saveCreationPrompt = async (taskListId, prompt) =>{
    const taskList = await TaskList.findById(taskListId);
    taskList.creationPrompt = prompt;
    await taskList.save();
}

module.exports = saveCreationPrompt;