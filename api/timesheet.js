const express = require('express');
const timesheetRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');



timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
  db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId`, {$timesheetId: timesheetId}, (err, timesheet) => {
    if(err){
      next(err);
    } else if(timesheet){
      req.timesheet = timesheet;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

timesheetRouter.get('/', (req, res, next) => {
  // const employeeId = req.params.employeeId;
  db.all(`SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId`, {$employeeId: req.params.employeeId}, (error, timesheets) => {
    if(error){
      next(error)
    } else {
      res.status(200).send({timesheets: timesheets});
    }
  });
});

timesheetRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const employeeId = req.params.employeeId;
  const date = req.body.timesheet.date;

  db.get(`SELECT * FROM Employee WHERE Employee.id = $employeeId`, {$employeeId: employeeId}, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !rate|| !employee) {
        return res.sendStatus(400);
      } else {
        db.run(`INSERT INTO Timesheet(hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)`,
        {$hours: hours, $rate: rate, $date: date, $employeeId: req.params.employeeId}, function(error) {
          if(error){
            next(error);
          } else { db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
            (error, timesheet) => {
              return res.status(201).json({timesheet: timesheet});
            });
          }
        });
      }
    }
  });
});

timesheetRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const employeeId = req.params.employeeId;
  const date = req.body.timesheet.date;
  const timesheetId = req.params.timesheetId;

  db.get(`SELECT * FROM Employee WHERE Employee.id = $employeeId`, {$employeeId: employeeId}, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date ||!employee) {
        return res.sendStatus(400);
      } else{
      db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date  WHERE Timesheet.id = $timesheetId`,
        {$hours: hours, $rate: rate, $date: date, $timesheetId: timesheetId}, function(error) {
          if(error){
            return res.sendStatus(400);
          } else {
            db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId}`,
            (error, timesheet) => {
              return res.status(200).json({timesheet: timesheet});
            });
          }
        });
      }
    }
  })
});

// timesheetRouter.delete('/:timesheetId', (req, res, next) => {
//   const timesheetId = req.params.timesheetId;
//   db.get(`SELECT * FROM Employee WHERE Employee.id = $employeeId`, {$employeeId: req.params.employeeId}, (error, employee) => {
//     if (error) {
//       next(error);
//     } else if (employee){
//       res.sendStatus(400);
//     } else {
//       db.run(`DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId`, {$timesheetId: timesheetId}, (error) => {
//         if(error){
//           next(error);
//         } else {
//           res.sendStatus(204);
//         }
//       });
//     }
//   });
// });

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
  const timesheetId = req.params.timesheetId;
  db.run(`DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId`, {$timesheetId: timesheetId}, (error) => {
    if(error){
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});



module.exports=timesheetRouter;
