'use strict'

const express = require('express')
const mongo = require('mongodb')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const dns = require('dns')

const cors = require('cors')

const app = express()

// Basic Configuration
const port = process.env.PORT || 3000

const dbUser = process.env.DBUSER
const dbPwd = process.env.DBPWD
const dbHost = process.env.DBHOST
const dbPort = process.env.DBPORT

/** this project needs a db !! **/
mongoose.connect('mongodb://' + dbUser + ':' + dbPwd + '@' + dbHost + ':' + dbPort + '/urlshorter?authSource=admin', { useNewUrlParser: true })
var schema = new mongoose.Schema({ original_url: 'String', short_url: 'Number' })
var ShortUrl = mongoose.model('shortUrl', schema)

app.use(cors())

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use('/public', express.static(process.cwd() + '/public'))

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html')
})

// your first API endpoint...
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' })
})

app.post('/api/shorturl/new/', function (req, res) {
  var url = req.body.url

  dns.lookup(url, (err, address, family) => {
    // Verify if the url is valid
    if (err) {
      res.json({ 'error': 'invalid URL' })
    } else {
      // Verifies if the url is already inserted on the database
      ShortUrl.findOne({ 'original_url': url }, function (err, shortUrl) {
        if (!err && shortUrl) {
          res.json({ 'original_url': shortUrl.original_url, 'short_url': shortUrl.short_url })
        } else {
          res.send('doenst exist')
        }
      })
      // ShortUrl.create({ 'original_url': url, 'short_url': 1 })
      // res.send(url)
    }
  })
})

app.listen(port, function () {
  console.log('Node.js listening on port ' + port)
})
