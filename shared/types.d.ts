// export type Language = 'English' | 'Frenc

export type Movie = {
  id: number,
  backdrop_path: string,
  genre_ids: number[],
  original_language: string,
  original_title: string,
  adult: boolean,
  overview: string,
  popularity: number,
  poster_path: string,
  release_date: string,
  title: string,
  video: boolean,
  vote_average: number,
  vote_count: number
}

export type MovieCast = {
  movieId: number;
  actorName: string;
  roleName: string;
  roleDescription: string;
};
// Used to validate the query string og HTTP Get requests
export type MovieCastMemberQueryParams = {
  movieId: string;
  actorName?: string;
  roleName?: string
}

export type MovieResponse = {
  data: Record<string, any>;
  cast?: Record<string, any>[];
};


export type MovieReview = {
  movieId: number;
  reviewerName: string;
  content: string;
  reviewDate: string;
  rating: number;
};

export type SignUpBody = {
  username: string;
  password: string;
  email: string
}

export type ConfirmSignUpBody = {
  username: string;
  code: string;
}

export type SignInBody = {
  username: string;
  password: string;
}
