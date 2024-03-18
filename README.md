## Serverless REST Assignment.

__Name:__ Shaobo Zang

__Video demonstration:__ (https://youtu.be/QQyGEG-zkwU)https://youtu.be/ms46tIm3FgU

This repository contains an implementation of a serverless REST API for the AWS platform. The CDK framework is used to provision its infrastructure. The API's domain context is movie reviews.

### API endpoints.

 
+ POST /movies/reviews - add a movie review.
+ GET /movies/{movieId}/reviews - Get all the reviews for a movie with the specified id.
+ GET /movies/{movieId}/reviews?minRating=n - Get all the reviews for the film with the specified ID whose rating was higher than the minRating.
+ GET /movies/{movieId}/reviews/{reviewerName} - Get the review for the movie with the specified movie ID and written by the named reviewer.
+ PUT /movies/{movieId}/reviews/{reviewerName} - Update the text of a review.
+ GET /movies/{movieId}/reviews/{year} - Get the reviews written in a specific year for a specific movie.
+ GET /reviews/{reviewerName} - Get all the reviews written by a specific reviewer.
+ GET /reviews/{reviewerName}/{movieId}/translation?language=code - Get a translated version of a movie review using the movie ID and reviewer name as the identifier.

[Include screenshots from the AWS management console (API Gateway service) that clearly show the deployed API ( ensure the font size is legible). ]

![!\[alt text\](api-1.png)](images/api-1.png)

![!\[alt text\](image-1.png)](images/api-2.png)

### Authentication (if relevant).

![!\[alt text\](image.png)](images/auth.png)

![!\[alt text\](image.png)](images/pool.png)

### Independent learning (If relevant).
(https://docs.aws.amazon.com/translate/latest/dg/what-is.html)

