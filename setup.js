const ecosystem = require("./ecosystem.config")
const mysql = require('mysql');
require("dotenv").config()
const generator = require('generate-password');
const fs = require('fs')


var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: process.env.DB_ROOT_PASSWORD
});


con.connect(err => {
	if (err) throw err;
	ecosystem.apps.forEach(app => {
		const name = app.name
  
		var password = generator.generate({ length: 10, numbers: true });
		con.query(`CREATE DATABASE IF NOT EXISTS ${name}`);
		con.query(`CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED BY '${password}'`);
		con.query(`ALTER USER 'user'@'%' IDENTIFIED BY '${password}'`);
		con.query(`grant all privileges on *.* to 'user'@'%'`);
		con.query(`flush privileges`);
		
		var data = fs.readFileSync(`.env.${name}`, 'utf-8');
		var newValue = data.replace(/^DATABASE_URL="([^"]*)"/gim, `DATABASE_URL="mysql://user:${password}@localhost:3306/${name}"`);
		fs.writeFileSync(`.env.${name}`, newValue, 'utf-8');
		console.log("finished")
	})
});