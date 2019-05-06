const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const timesheetRouter = require('./timesheet.js');


employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get(`SELECT * FROM Employee WHERE Employee.id = $employeeId`, {$employeeId: employeeId}, (err, employee) => {
    if(err){
      next(err)
    } else if (employee){
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetRouter);

employeesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE Employee.is_current_employee = 1`, (err, employees) => {
    if(err){
      next(err)
    } else {
      res.status(200).send({employees: employees});
    }
  });
});

employeesRouter.get('/:employeeId', (req, res, next) =>{
  res.status(200).json({employee: req.employee});
});

employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;

  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }
  const currentEmployee = req.body.employee.currentEmployee === 0 ? 0 : 1;

  db.run(`INSERT INTO Employee(name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $currentEmployee)`,
  {$name: name, $position: position, $wage: wage, $currentEmployee: currentEmployee}, function(error) {
    if(error){
      next(error);
    } else { db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
      (error, employee) => {
        res.status(201).json({employee: employee});
      });
    }
  });
});

employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;
  const currentEmployee = req.body.employee.currentEmployee === 0 ? 0 : 1;
  const employeeId = req.params.employeeId;


  if (!name || !wage || !position) {
    return res.sendStatus(400);
  }
  db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $currentEmployee WHERE Employee.id = $employeeId`,
    {$name: name, $position: position, $wage: wage, $currentEmployee: currentEmployee, $employeeId: employeeId}, (error) => {
      if(error){
        next(error);
      } else { db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
      }
    });
  });

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const employeeId = req.params.employeeId;
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId`, {$employeeId: employeeId}, (error) => {
    if(error){
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId}`, (error, employee) => {
        res.status(200).json({employee: employee});
      });
    }
  });
});



module.exports=employeesRouter;
