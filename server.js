var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var bcrypt = require('bcrypt');
const saltRounds = 10;



var con = mysql.createConnection({
	user: "root",
	password: "",
	database: "carshop"
});

var app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(express.static("public"));

function query(sql) {
	return new Promise(function(resolve, reject) {
		con.query(sql, function(err, result, fields) {
			if (err) return reject(err);
			resolve(result);
		});
	});
}

app.get('/carmodels', async function(req, res) {
	try {
		var txt = await query("SELECT * FROM carmodels");
		res.end(JSON.stringify(txt));
	} catch (error) {
		res.end(error.sqlMessage)
		console.log(error)
	}
});

app.post('/carmodels', async function(req, res) {
	body = req.body
	if (req.session.loggedin) {
		try {
			var txt = await query("SELECT admin FROM accounts WHERE accounts.username='" + req.session.username + "'");
			if (txt[0].admin > 0) {
				if (body.brand && body.model && Number(body.price)) {
					try {
						var txt = await query("INSERT INTO carmodels (brand, model, price) VALUES ('" + (body.brand) + "','" + (body.model) + "'," + (body.price) + ")");
						body.id = txt.insertId;
						res.end(JSON.stringify(body))
					} catch (error) {
						res.end(error.sqlMessage)

						console.log(error)
					}
				} else {
					res.end("1337")
				}
			} else {
				res.end("No access")
			}
		} catch (err) {
			res.end(err.sqlMessage);
			console.log(err)
		}
	} else {
		res.end("Not logged in")
	}

});

app.delete('/carmodels', async function(req, res) {
	body = req.body

	if (req.session.loggedin) {
		try {
			var txt = await query("SELECT admin FROM accounts WHERE accounts.username='" + req.session.username + "'");
			if (txt[0].admin > 0) {
				try {
					var txt = await query("SELECT * FROM carmodels WHERE id = " + (body.id));
					await query("DELETE FROM carmodels WHERE id = " + (body.id));
					res.end(JSON.stringify(txt));

				} catch (error) {
					res.end(error.sqlMessage)

					console.log(error)
				}
			} else {
				res.end("No access")
			}
		} catch (err) {
			res.end(err.sqlMessage);
			console.log(err)
		}
	} else {
		res.end("Not logged in")
	}

});

app.get('/total_sales', async function(req, res) {
	try {
		var txt = await query("SELECT * FROM employees LEFT JOIN totalsales ON employees.id = totalsales.employee_id");
		res.end(JSON.stringify(txt));
	} catch (error) {
		res.end(error.sqlMessage)
		console.log(error)
	}
});

app.get('/employees', async function(req, res) {
	try {
		var txt = await query("SELECT * FROM employees");
		res.end(JSON.stringify(txt))
	} catch (error) {
		res.end(error.sqlMessage)

		console.log(error)
	}
});


//Added backend
app.post('/login', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	if (username && password) {
		con.query("SELECT password FROM accounts WHERE username = '" + username + "'", function(error, results, fields) {
			if (results.length > 0) {
				bcrypt.compare(password, results[0].password, function(err, result) {
					if (result == true) {
						req.session.loggedin = true;
						req.session.username = username;
						res.end('Success');
					} else {
						res.end('Incorrect password');
					}
				});

			} else {
				res.end('Incorrect Username');
			}
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});


app.get('/logout', function(req, res) {
	req.session.loggedin = false;
	res.end('Success');
});

app.get('/userinfo', async function(req, res) {
	if (req.session.loggedin) {
		try {
			var txt = await query("SELECT accounts.employee_id, username, admin, totalsales.sales FROM accounts LEFT JOIN totalsales ON accounts.employee_id = totalsales.employee_id WHERE accounts.username='" + req.session.username + "'");
			res.end(JSON.stringify(txt));
		} catch (err) {
			res.end(err.sqlMessage);
			console.log(err)
		}
	} else {
		res.end('false');
	}

});

//ADMIN

app.get('/admin', async function(req, res) {
	if (req.session.loggedin) {
		try {
			var txt = await query("SELECT admin FROM accounts WHERE accounts.username='" + req.session.username + "'");
			if (txt[0].admin == 2) {
				res.sendFile(path.join(__dirname + '/admin.html'));
			} else {
				res.redirect("/")
			}
		} catch (err) {
			res.end(err.sqlMessage);
			console.log(err)
		}
	} else {
		res.redirect("/")
	}
});

app.get('/accounts', async function(req, res) {
	if (req.session.loggedin) {
		try {
			var txt = await query("SELECT admin FROM accounts WHERE accounts.username='" + req.session.username + "'");
			if (txt[0].admin == 2) {
				try {
					var txt = await query("SELECT id, employee_id, username, admin FROM accounts");
					res.end(JSON.stringify(txt))
				} catch (err) {
					res.end(err.sqlMessage);
					console.log(err)
				}
			} else {
				res.redirect("/")
			}
		} catch (err) {
			res.end(err.sqlMessage);
			console.log(err)
		}
	} else {
		res.redirect("/")
	}
});



app.delete('/accounts', async function(req, res) {
	body = req.body

	if (req.session.loggedin) {
		try {
			var txt = await query("SELECT id,admin FROM accounts WHERE accounts.username='" + req.session.username + "'");
			if (txt[0].id != body.id) {
				if (txt[0].admin == 2) {
					try {
						var txt = await query("DELETE FROM accounts WHERE id = " + (body.id));
						console.log(txt)
						res.end(JSON.stringify(txt));

					} catch (error) {
						res.end(error.sqlMessage)
						console.log(error)
					}
				} else {
					res.end("No admin status")
				}
			} else {
				res.end("1337")
			}
		} catch (err) {
			res.end(err.sqlMessage);
			console.log(err)
		}
	} else {
		res.end("Not logged in")
	}


});

app.post('/accounts', async function(req, res) {
	body = req.body

	if (req.session.loggedin) {
		try {
			var txt = await query("SELECT id,admin FROM accounts WHERE accounts.username='" + req.session.username + "'");
			if (txt[0].admin == 2) {
				if (body.employee_id == "")
					body.employee_id = 0;
				if (body.admin == "")
					body.admin = 0;

				if (body.username && body.pwd && Number(body.employee_id) && Number(body.admin)) {
					try {
						bcrypt.hash(body.pwd, saltRounds, async function(err, hash) {
							var txt = await query("INSERT INTO accounts (employee_id, username, password, admin) VALUES ('" + (body.employee_id) + "','" + (body.username) + "','" + hash + "'," + (body.admin) + ")");
							res.end(JSON.stringify(txt.affectedRows));
						});
					} catch (error) {
						console.log(error)
						res.send(JSON.stringify(error.errno))
					}
				} else {
					res.end("1337")
				}

			} else {
				res.end("No admin status")
			}
		} catch (err) {
			res.end(err.sqlMessage);
			console.log(err)
		}
	} else {
		res.end("Not logged in")
	}

});

app.listen(8080);