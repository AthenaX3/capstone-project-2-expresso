const express = require('express');
const menuRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menuItemRouter = require('./menuItem.js');


menuRouter.param('menuId', (req, res, next, menuId) => {
  db.get(`SELECT * FROM Menu WHERE Menu.id = $menuId`, {$menuId: menuId}, (err, menu) => {
    if(err){
      next(err)
    } else if (menu){
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menuRouter.use('/:menuId/menu-items', menuItemRouter);

menuRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, menus) => {
    if(err){
      next(err)
    } else {
      res.status(200).send({menus: menus});
    }
  });
});

menuRouter.get('/:menuId', (req, res, next) =>{
  res.status(200).json({menu: req.menu});
});

menuRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;

  if (!title) {
    return res.sendStatus(400);
  }
  db.run(`INSERT INTO Menu(title) VALUES ($title)`,
  {$title: title}, function(error) {
    if(error){
      next(error);
    } else { db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
      (error, menu) => {
        return res.status(201).json({menu: menu});
      });
    }
  });
});

menuRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title;
  const menuId = req.params.menuId;


  if (!title || !menuId) {
    return res.sendStatus(400);
  }
  db.run(`UPDATE Menu SET title = $title WHERE Menu.id = $menuId`,
    {$title: title, $menuId: menuId}, (error) => {
      if(error){
        next(error);
      } else { db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId}`,
        (error, menu) => {
          res.status(200).json({menu: menu});
        });
      }
    });
  });

menuRouter.delete('/:menuId', (req, res, next) => {
  const menuId = req.params.menuId;
  db.get(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId`, {$menuId: menuId}, (error, menuItem) => {
    if(error){
      next(error);
    } else if(menuItem){
      res.sendStatus(400);
    } else{
      db.run(`DELETE FROM Menu WHERE Menu.id = $menuId`, {$menuId: menuId}, (error) => {
        if(error){
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});





module.exports=menuRouter;
