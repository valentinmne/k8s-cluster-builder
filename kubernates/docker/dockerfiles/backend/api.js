const app = require('express');
const router = app.Router();
const mysql = require('mysql');
const cors = require('cors');



var con = mysql.createConnection({
    host: process.env.MYSQL,
    user: 'root',
    port: '3306',
    password: 'root',
    database: 'mysql',
    charset  : 'utf8',
})
con.connect(function(err) {
    if(err) console.log(err);
});// our simple get /jobs API
router.get('/db',(req, res) => {
    con.query("SELECT * FROM db", function (err, result, fields) {
        if (err) res.send(err);
        res.send(result);
        console.log(result);
    });
});

module.exports = router;
