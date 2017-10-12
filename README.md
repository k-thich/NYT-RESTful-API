# NYT-RESTful-API
Simple RESTful API that reads a [NYT JSON](http://developer.nytimes.com/top_stories.json) file deployed on a Node.js server

## Setup
Use ```node server.js``` to run the server and make requests on port `8080` with `http://127.0.0.1:8080/` 

## Endpoints
- `/article` -- Gets a list of all articles with the following fields for each article:[title, published_date, abstract, short_url]
- `/authors` -- Gets a list of all known authors sorted in alphabetical order.
- `/short_urls` -- Gets a list of all article short URLs grouped by published_date
- `/articles?field=des_facet` -- Gets a list of tags from the des_facet field.
- `/articles/[index]` -- Gets the details of the article at the given index with the following fields: [section, subsection, title, abstract, byline, published_date, des_facet]. If no index is provided, the index is defaulted to 0. If the index provided is invalid (out of range), nothing is returned.
- `/articles_images` -- Gets a list of articles with the following fields: [title, url, image_url, caption]. Each article is displayed as a hyperlinked image using the articles' thumbnail. If no thumbnail is provided, a placeholder is used with the articles' title.
