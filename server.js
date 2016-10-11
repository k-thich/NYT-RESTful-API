var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var nytimes = require('./nytimes.json', 'utf-8');

var server = http.createServer(function (req, res) {
    
    var restData = url.parse(req.url).pathname;
    var queryData = url.parse(req.url, true).query;
    var filePath = __dirname + req.url;
    var parsedRest = parse_rest(restData);
    
    if (serveFiles(parsedRest)) return;
    
    if (parsedRest.length === 1) {
        if (parsedRest[0] === 'articles' && Object.keys(queryData).length === 0) { // Get all articles
            var articles = [];
            for (i = 0; i < nytimes[0].results.length; i ++) {
                var article = {
                    title: nytimes[0].results[i].title,
                    published_date: nytimes[0].results[i].published_date.substring(0, 10),
                    abstract: nytimes[0].results[i].abstract,
                    short_url: nytimes[0].results[i].short_url};
                articles.push(article);
            }
            // Sort articles by publish date
            articles.sort(function(a,b) {
                return (a.published_date > b.published_date) ? 1 : ((b.published_date > a.published_date) ? -1 : 0);
            }); 
            res.writeHead(200);
            res.end(JSON.stringify(articles, null, 4));
        } else if (parsedRest[0] === 'articles' && ('field' in queryData)) { // Get des_facet tags
            if (queryData['field'] === 'des_facet'){
                var tags = [];
                for (i = 0; i < nytimes[0].results.length; i ++) {
                    for (j = 0; j < nytimes[0].results[i].des_facet.length; j ++) {
                        var tag = String(nytimes[0].results[i].des_facet[j]);
                        tags.push(tag);
                    }
                }
                res.writeHead(200);
                res.end(JSON.stringify(tags, null, 4));
            }
        } else if (parsedRest[0] === 'authors') { // Get the authors
            var author_string = '';
            var authors = [];
            for (i = 0; i < nytimes[0].results.length; i ++) {
                var author = nytimes[0].results[i].byline;
                author_string = author_string + author;
            }
            // Build array of author names
            author_string = author_string.replace(/By /gi, ', ');
            author_string = author_string.replace(/ and /gi, ', ');
            author_string = name_case(author_string);
            author_string = author_string.replace(/De La/g, 'de la');
            authors = parse_names(author_string);
            authors = authors.map(function (str) {
                return str.trim();
            })
            // Sort authors alphabetically
            authors.sort();
            // Remove duplicate authors
            authors = authors.filter(function(elem, index, self) {
                return index == self.indexOf(elem);
            })
            res.writeHead(200);
            res.end(JSON.stringify(authors, null, 4));  
        } else if (parsedRest[0] === 'short_urls') { // Get article short urls
            var grouped_short_urls = [];
            // Get the publish dates of all articles
            var dates = [];
            for (i = 0; i < nytimes[0].results.length; i ++) {
                var date = nytimes[0].results[i].published_date.substring(0,10);
                dates.push(date);
            }
            // Remove duplicate publish dates
            dates = dates.filter(function(elem, index, self) {
                return index == self.indexOf(elem);
            })
            // Sort publish dates
            dates = dates.sort();
            // Get short urls grouped by the publish dates
            dates.forEach(function (date) {
                var group = {date: date,
                             short_urls: []};
                for (i = 0; i < nytimes[0].results.length; i ++) {
                    if (nytimes[0].results[i].published_date.substring(0,10) === date) {
                        group.short_urls.push(nytimes[0].results[i].short_url);
                    }
                }
                grouped_short_urls.push(group);
            });
            res.writeHead(200);
            res.end(JSON.stringify(grouped_short_urls, null, 4)); 
        } else if (parsedRest[0] === 'articles_images') { // Get articles images and titles
            var articles_images = [];
            for (i = 0; i < nytimes[0].results.length; i ++) {
                var article = {
                    title: nytimes[0].results[i].title,
                    url: nytimes[0].results[i].url,
                    image_url: null,
                    caption: null};
                if (nytimes[0].results[i].multimedia.length >= 1) {
                    for (j = 0; j < nytimes[0].results[i].multimedia.length; j ++) {
                        if (nytimes[0].results[i].multimedia[j].format === 'Standard Thumbnail') { // Get thumbnail image
                            article.image_url = nytimes[0].results[i].multimedia[j].url;
                            article.caption = nytimes[0].results[i].multimedia[j].caption;
                        }
                    }
                    if (article.image_url === null) { // Get the first image regardless of format
                        article.image_url = nytimes[0].results[i].multimedia[0].url;
                        article.caption = nytimes[0].results[i].multimedia[0].caption;
                    }
                }
                articles_images.push(article);
            }
            // Sort articles by title
            articles_images.sort(function(a,b) {
                return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);
            }); 
            res.writeHead(200);
            res.end(JSON.stringify(articles_images, null, 4)); 
        }
    } else {
        if (parsedRest[0] === 'articles' && Number.isInteger(parseInt(parsedRest[1], 10))){ // Get details of specific article
            var index = parseInt(parsedRest[1], 10);
            if (0 <= index && index < nytimes[0].results.length) {
                var article = {
                    section: nytimes[0].results[index].section,
                    subsection: nytimes[0].results[index].subsection,
                    title: nytimes[0].results[index].title,
                    abstract: nytimes[0].results[index].abstract,
                    byline: nytimes[0].results[index].byline,
                    published_date: nytimes[0].results[index].published_date.substring(0,10),
                    des_facet: nytimes[0].results[index].des_facet};
            } else {
                var article = {};
            }
            res.writeHead(200);
            res.end(JSON.stringify(article, null, 4));
        }
    }
    
    function serveFiles(p) { // Serve .html, .css, .js files
    
        if (p.length == 0) { // Serve html file
            fs.readFile(__dirname + '/index.html', 'utf8', function (err, data) {
                if (err) {
                    console.log(err);
                }
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(data); 
                return true;
            });
        }
        
        if (p[2] === 'jquery-2.2.4.js'){ // Serve jquery file
            fs.readFile(__dirname + '/assets/scripts/jquery-2.2.4.js', 'utf8', function (err, data) {
                if (err) {
                    console.log(err);
                }
                res.writeHead(200, {'Content-Type': 'text/javascript'});
                res.end(data);
                return true;
            });
        }
        
        if (p[2] === 'script.js'){ // Serve javascript file
            fs.readFile(__dirname + '/assets/scripts/script.js', 'utf8', function (err, data) {
                if (err) {
                    console.log(err);
                }
                res.writeHead(200, {'Content-Type': 'text/javascript'});
                res.end(data);
                return true;
            });
        }
        
        if (p[2] === 'style.css'){ // Serve css file
            fs.readFile(__dirname + '/assets/css/style.css', 'utf8', function (err, data) {
                if (err) {
                    console.log(err);
                }
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.end(data); 
                return true;
            });
        }
        
        return false;
    }
    
});

server.listen(8080);
console.log('Server running at http://localhost:8080/');

function name_case(str) { // Converts all author names to name case
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function parse_rest(rest) { // Parse the rest arguements from url
    return rest.split('/').filter(function(e){
        if (e.trim() !== '') return true; // Removes unncecessary spaces
    });
}

function parse_names(names) { // Parse the author names
    return names.split(',').filter(function(e){
        if (e.trim() !== '') return true; // Removes unncecessary spaces
    });
}
