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
const dbURL = process.env.MONGODBURL

/** this project needs a db !! **/
mongoose.connect(dbURL, { useNewUrlParser: true })
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
  // Removes scheme ( https://, ftp:// etc), port and path from url
  var hostname = url.replace(/(.*\/\/)|(:\d*)|(\/.*)/g, '')

  dns.lookup(hostname, (err, address, family) => {
    // Verify if the url is valid
    if (err) {
      res.json({ 'error': 'invalid URL' })
    } else {
      // Verifies if the url is already inserted on the database
      ShortUrl.findOne({ 'original_url': url }, function (err, shortUrl) {
        if (!err && shortUrl) {
          res.json({ 'original_url': shortUrl.original_url, 'short_url': shortUrl.short_url })
        } else {
          // Get the last inserted url
          ShortUrl.find().sort({ _id: -1 }).limit(1).exec((err, lastShortUrl) => {
            var urlNumber
            // Verifies if the collection is not empty
            if (!err & lastShortUrl.length >= 1) {
              // Get the last number used to a short url
              var lastNumber = lastShortUrl[0].short_url
              urlNumber = Number(lastNumber) + 1
            } else {
              urlNumber = 1
            }
            ShortUrl.create({ 'original_url': url, 'short_url': urlNumber }, (err, shortUrl) => {
              if (err) res.send(err)
              else res.json({ 'original_url': shortUrl.original_url, 'short_url': shortUrl.short_url })
            })
          })
        }
      })
    }
  })
})

app.get('/api/shorturl/:number', function (req, res) {
  var urlNumber = req.params.number
  ShortUrl.findOne({ 'short_url': urlNumber }, function (err, shortUrl) {
    if (err) {
      res.send(err)
    } else {
      res.redirect(shortUrl.original_url)
    }
  })
})

app.listen(port, function () {
  console.log('Node.js listening on port ' + port)
})
