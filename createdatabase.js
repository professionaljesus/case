const mysql = require('mysql')
const bcrypt = require('bcrypt')
const saltRounds = 10;

var options = {
  user: 'root',
  password: ''
}
var con = mysql.createConnection(options);

const data = require('./data.json')

var carshop = data.carshop

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("DROP DATABASE IF EXISTS carshop", function(err, result) {
    if (err) {
      console.log(err.sqlMessage);
    } else {
      console.log("Carshop dropped oops");
      con.query("CREATE DATABASE IF NOT EXISTS carshop", function(err, result) {
        if (err) {
          console.log(err.sqlMessage);
        } else {
          console.log("Database created");
          tablesetc();
        }
      });
    }
  });


});


function priceCheck(sid) {
  for (var i in carshop.carmodels) {
    if (carshop.carmodels[i].id == sid) {
      return carshop.carmodels[i].price;
    }
  }
}

function update(i) {
  return new Promise(function(resolve, reject) {
    con.query("UPDATE totalsales SET sales = sales + " + priceCheck(carshop.sales[i].carmodel_id) + " WHERE employee_id = " + carshop.sales[i].employee_id, function(err, result, fields) {
      if (err) return reject(err);
      resolve(result);
    });
  });
}



function tablesetc() {

  options = {
    user: 'root',
    password: '',
    database: 'carshop'
  }

  con = mysql.createConnection(options)

  con.connect(async function(err) {
    if (err) console.log(err.sqlMessage);
    else console.log("Connected!");

    var sql = "CREATE TABLE IF NOT EXISTS employees (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))";

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Employees stable created");

    });

    sql = "INSERT INTO employees (id, name) VALUES ";
    for (var i in carshop.employees) {
      sql += "(" + carshop.employees[i].id + ",'" + carshop.employees[i].name + "'),"
    }

    sql = sql.substr(0, sql.length - 1) + ";"

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Employees inserted");

    });

    sql = "CREATE TABLE IF NOT EXISTS carmodels (id INT AUTO_INCREMENT PRIMARY KEY, brand VARCHAR(255), model VARCHAR(255), price INT)"

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Carmodels table created");

    });

    sql = "INSERT INTO carmodels (id, brand, model, price) VALUES ";
    for (var i in carshop.carmodels) {
      sql += "(" + carshop.carmodels[i].id + ",'" + carshop.carmodels[i].brand + "','" + carshop.carmodels[i].model + "'," + carshop.carmodels[i].price + "),"
    }

    sql = sql.substr(0, sql.length - 1) + ";"

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Carmodels inserted");

    });

    sql = "CREATE TABLE IF NOT EXISTS sales (id INT AUTO_INCREMENT PRIMARY KEY, employee_id INT, carmodel_id INT)"

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Sales table created");

    });

    sql = "INSERT INTO sales (id, employee_id, carmodel_id) VALUES ";
    for (var i in carshop.sales) {
      sql += "(" + carshop.sales[i].id + "," + carshop.sales[i].employee_id + "," + carshop.sales[i].carmodel_id + "),"
    }

    sql = sql.substr(0, sql.length - 1) + ";"

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Sales inserted");

    });

    sql = "CREATE TABLE IF NOT EXISTS totalsales (employee_id INT PRIMARY KEY , sales INT)";

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Totalsales table created");

    });

    sql = "INSERT INTO totalsales (employee_id, sales) VALUES ";
    for (var i in carshop.employees) {
      sql += "(" + carshop.employees[i].id + ",0),"
    }

    sql = sql.substr(0, sql.length - 1) + ";"

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Employees inserted into totalsales");
    });

    for (var i in carshop.sales) {
      try {
        var b = await update(i);
      } catch (error) {
        console.log(error);
      }
    }


    sql = "CREATE TABLE IF NOT EXISTS accounts (id INT AUTO_INCREMENT PRIMARY KEY, employee_id INT, username varchar(255) UNIQUE, password varchar(255), admin INT)";

    con.query(sql, function(err, result) {
      if (err) console.log(err.sqlMessage);
      else console.log("Totalsales table created");

    });

    bcrypt.hash('pw', saltRounds, function(err, hash) {
      sql = "INSERT INTO accounts (employee_id, username, password, admin) VALUES (1,'admin','" + hash + "',2)";
      con.query(sql, function(err, result) {
        if (err) console.log(err.sqlMessage);
        else console.log("Admin created");

      });
    });



  });
}