const TaskList = require('./models/TaskList');
const Task = require('./models/Task');

async function resetScheduledTaskLists() {
  const now = new Date();

  const allLists = await TaskList.find({
    'resetSchedule.number': { $ne: null },
    'resetSchedule.cadence': { $ne: null },
    'resetSchedule.startDate': { $ne: null },
  });

  let resetCount = 0;

  for (const list of allLists) {
    const { number, cadence, startDate, lastReset } = list.resetSchedule;

    const start = new Date(startDate); // UTC
    const last = lastReset ? new Date(lastReset) : new Date(startDate);

    let nextReset = new Date(last);

    // cadence === "days" → fixed interval, drift allowed
    if (cadence === 'days') {
      nextReset.setDate(last.getDate() + number);
    }

    // cadence === weeks/months/years → always aligned to startDate day/time
    else {
      // Calculate how many full cadences have passed since startDate
      const elapsed = now.getTime() - start.getTime();
      let cycles = 0;

      switch (cadence) {
        case 'weeks':
          cycles = Math.floor(elapsed / (1000 * 60 * 60 * 24 * 7 * number));
          break;
        case 'months': {
          const nowYear = now.getFullYear();
          const nowMonth = now.getMonth();
          const startYear = start.getFullYear();
          const startMonth = start.getMonth();
          const totalMonths = (nowYear - startYear) * 12 + (nowMonth - startMonth);
          cycles = Math.floor(totalMonths / number);
          break;
        }
        case 'years': {
          const diff = now.getFullYear() - start.getFullYear();
          cycles = Math.floor(diff / number);
          break;
        }
      }

      if (cycles === 0) continue;

      // Generate nextReset aligned with startDate
      nextReset = new Date(start);
      switch (cadence) {
        case 'weeks':
          nextReset.setDate(start.getDate() + 7 * number * cycles);
          break;
        case 'months':
          nextReset.setMonth(start.getMonth() + number * cycles);
          break;
        case 'years':
          nextReset.setFullYear(start.getFullYear() + number * cycles);
          break;
      }
    }

    if (now >= nextReset) {
      await Task.updateMany({ listId: list._id }, { completed: false });

      list.resetSchedule.lastReset = now;
      await list.save();
      resetCount++;
    }
  }

  console.log(`✅ Reset ${resetCount} task list${resetCount === 1 ? '' : 's'}`);
}

module.exports = resetScheduledTaskLists;
