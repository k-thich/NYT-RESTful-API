$(document).ready(function() {
    
    var url;
    var article_index;
    var request_type;

    $('#get_all_articles').click(get_articles);
    $('#get_all_authors').click(get_authors);
    $('#get_all_short_urls').click(get_urls);
    $('#get_des_facet_tags').click(get_tags);
    $('#get_article_details').click(get_details);
    $('#get_all_articles_image').click(get_images);
    
////////////////////////////////////////////////////////////////////////////////////
    
    function get_articles() {
        request_type = 0;
        url = 'articles';
        send_request(url, request_type);
    }

    function get_authors() {
        request_type = 1;
        url = 'authors';
        send_request(url, request_type);
    }

    function get_urls() {
        request_type = 2
        url = 'short_urls';
        send_request(url, request_type);
    }

    function get_tags() {
        request_type = 3;
        url = 'articles?field=des_facet';
        send_request(url, request_type);
    }

    function get_details() {
        request_type = 4;
        article_index = document.getElementById('article_num').value;
        if (article_index === '') {
            article_index = 0;
        }
        url = 'articles/' + article_index;
        send_request(url, request_type);
    }

    function get_images() {
        request_type = 5;
        url = 'articles_images';
        send_request(url, request_type);
    }

////////////////////////////////////////////////////////////////////////////////////
    
    // Send Request to Server
    function send_request(url, request_type) {
        console.log(url);
        clear_content();
        $.ajax({
            url: url,
            success: function (data) {
                data = JSON.parse(data);
                if (request_type === 0) {
                    display_articles(data);
                } else if (request_type === 1) {
                    display_authors(data);
                } else if (request_type === 2) {
                    display_short_urls(data);
                } else if (request_type === 3) {
                    display_tags(data);
                } else if (request_type === 4) {
                    display_article_detail(data);
                } else {
                    display_article_images(data);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
    
    // Clears all the content
    function clear_content() {
        $('#content').empty();
    }
    
    // Display all articles in plaintext
    function display_articles(data) {
        for (i = 0; i < data.length; i ++) {
            $('#content').append($('<article/>', {id: 'article' + '-' + i}));
            var curr_id = '#article' + '-' + i;
            $(curr_id).append($('<p/>', {class: 'title', text: 'Title: ' + data[i].title}));
            $(curr_id).append($('<p/>', {class: 'publish_date', text: 'Publish Date: ' + data[i].published_date}));
            $(curr_id).append($('<p/>', {class: 'abstract', text: 'Abstract: ' + data[i].abstract}));
            $(curr_id).append($('<p/>', {class: 'short_url', text: 'Short url: ' + data[i].short_url}));
            if (i + 1 != data.length) {
                $('#content').append($('<hr/>'));
            }
        } 
    }
    
    // Display a list of the known authors (sorted alphabetically)
    function display_authors(data) {
        $('#content').append($('<ul/>', {id: 'author_list'}));
        for (i = 0; i < data.length; i++) {
            $('#author_list').append($('<li/>', {text: data[i]}));
        }
    }
    
    // Display a list of the short urls (sorted alphabetically and grouped by publish date) 
    function display_short_urls(data) {
        for (i = 0; i < data.length; i ++) {
            $('#content').append($('<section/>', {id: data[i].date}));
            $('#' + data[i].date).append($('<p/>', {text: 'Published on ' + data[i].date + ':'}));
            $('#' + data[i].date).append($('<ul/>', {id: data[i].date + '-list'}));
            for (j = 0; j < data[i].short_urls.length; j ++) {
                $('#' + data[i].date + '-list').append($('<li/>', {id: data[i].date + '-' + j, text: data[i].short_urls[j]}));
                $('#' + data[i].date + '-' + j).wrap($('<a href=' + data[i].short_urls[j] + '/>'));
            }
        }
    }
    
    // Display a tag cloud of the des facet tags
    function display_tags(data) {
        var tags = {};
        $('#content').append($('<div/>', {id: 'tag_container'}));
        for (i = 0; i < data.length; i ++) {
            if (data[i] in tags){
                var font_size = parseInt($('#' + tags[data[i]]).css("font-size"));
                font_size = font_size + 5 + 'px';
                $('#' + tags[data[i]]).css({'font-size': font_size});
            } else {
                $('#tag_container').append($('<p/>', {id: i, class: 'tag', text: data[i]}));
                tags[data[i]] = i;
                $('#' + i).css({'font-size': '15px'});
            }
        }
    }
    
    // Display the article details of the given article index
    function display_article_detail(data) {
        if (data.title != undefined) { // Nothing was returned
            $('#content').append($('<article/>', {id: 'article'}));
            $('#article').append($('<p/>', {id: 'section', text: 'Section: ' + data.section}));
            $('#article').append($('<p/>', {id: 'subsection', text: 'Subsection: ' + data.subsection}));
            $('#article').append($('<p/>', {id: 'title', text: 'Title: ' + data.title}));
            $('#article').append($('<p/>', {id: 'section', text: 'Section: ' + data.section}));
            $('#article').append($('<p/>', {id: 'abstract', text: 'Abstract: ' + data.abstract}));
            $('#article').append($('<p/>', {id: 'byline', text: 'Byline: ' + data.byline}));
            $('#article').append($('<p/>', {id: 'published_date', text: 'Published Date: ' + data.section}));
            $('#article').append($('<p/>', {id: 'des_facet_tags', text: 'des_facet tags: '}));
            $('#article').append($('<ul/>', {id: 'tag_list'}));
            for (i = 0; i < data.des_facet.length; i ++) {
                    $('#tag_list').append($('<li/>', {id: 'tag-' + i, text: data.des_facet[i]}));
            }
        }
    }
    
    // Display hyperlinked article images
    function display_article_images(data) {
        $('#content').append($('<article/>', {class: 'article-images'}));
        for (i = 0; i < data.length; i ++) {
            if (data[i].image_url != null) {
                $('.article-images').append($('<img/>', {id: 'img-' + i, src: data[i].image_url, alt: data[i].caption,}));
                $('#img-' + i).css({'height': '100px', 'width': '100px', 'margin': '10px'});
                $('#img-' + i).wrap($('<a href=' + data[i].url + '/>'));
            } else {
                $('.article-images').append($('<div/>', {id: 'link-' + i, class: 'placeholder'}));
                $('#link-' + i).css({'height': '100px', 'width': '100px', 'margin': '10px'});
                $('#link-' + i).append($('<p/>', {text: data[i].title}));
                $('#link-' + i).wrap($('<a href=' + data[i].url + '/>'));
            }
        }
    }
    
});