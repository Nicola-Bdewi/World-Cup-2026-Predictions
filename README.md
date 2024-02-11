# World-Cup-2026-Predictions

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

In this website, you can enter the results before the matches start. The points will be calculated as follows: 
- 2 points if the predicted result is the same as the one after the match.
- 1 point if the winner was predicted correctly.
- 0 points otherwise.

The admin will enter the results after the matches then the points will be caluclated. For now, the admin's results could only be entered through the database (incomplete front-end yet)


### Built With

<img src="./icons/ExpressJS-Dark.svg" width="48">   <img src="./icons/PostgreSQL-Dark.svg" width="48">   <img src="./icons/JQuery.svg" width="48">   <img src="./icons/Bootstrap.svg" width="48"> 

<!-- GETTING STARTED -->
### Installation

1- Open the db.js and write the password of your database, if any. <br>
2- Create the following tables:

```
CREATE TABLE IF NOT EXISTS Users
(
    user_id integer,
    contact_email character varying(255),
    category_id integer,
    unit character varying(255),
    joined date,
    first_name character varying(255),
    last_name character varying(255)
)
```

```
CREATE TABLE IF NOT EXISTS admin
(
    match_id integer NOT NULL,
    teama_id integer,
    teamb_id integer,
    teama_score integer,
    teamb_score integer,
    winner integer GENERATED ALWAYS AS (calculate_winner(teama_score, teamb_score, teama_id, teamb_id)) STORED,
    CONSTRAINT admin_pkey PRIMARY KEY (match_id)
)
```

```
CREATE TABLE IF NOT EXISTS public.login
(
    login_id integer,
    hash character varying(255),
    email character varying(255)
)
```

```
CREATE TABLE IF NOT EXISTS public.teams
(
    id integer,
    name character varying(50),
    flag_url character,
    CONSTRAINT teams_pkey PRIMARY KEY (id),
    CONSTRAINT teams_name_key UNIQUE (name)
)
```

```
CREATE TABLE IF NOT EXISTS public.soccermatches
(
    id integer NOT NULL DEFAULT nextval('soccermatches_id_seq'::regclass),
    user_id integer,
    teama_id integer,
    teamb_id integer,
    teama_score integer,
    teamb_score integer,
    winner integer GENERATED ALWAYS AS (
CASE
    WHEN (teama_score > teamb_score) THEN teama_id
    WHEN (teama_score < teamb_score) THEN teamb_id
    ELSE 0
END) STORED,
    CONSTRAINT soccermatches_pkey PRIMARY KEY (id),
    CONSTRAINT soccermatches_teama_id_fkey FOREIGN KEY (teama_id)
        REFERENCES public.teams (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT soccermatches_teamb_id_fkey FOREIGN KEY (teamb_id)
        REFERENCES public.teams (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT soccermatches_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public."Users" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
```

And the follwing two functions: 

```
CREATE OR REPLACE FUNCTION public.calculate_winner(
	teama_score integer,
	teamb_score integer,
	teama_id integer,
	teamb_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    IMMUTABLE PARALLEL UNSAFE
AS $BODY$
BEGIN
    RETURN CASE
        WHEN teama_score > teamb_score THEN teama_id
        WHEN teama_score < teamb_score THEN teamb_id
        WHEN teama_score = teamb_score THEN 0
        ELSE -1
    END;
END; 
```

```
CREATE OR REPLACE FUNCTION public.calculate_winner_soccermatches(
	teama_score integer,
	teamb_score integer,
	teama_id integer,
	teamb_id integer)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
  RETURN CASE
    WHEN teama_score > teamb_score THEN teama_id
    WHEN teama_score < teamb_score THEN teamb_id
    ELSE 0
  END;
END;
```
And the following materialized views: 
```
CREATE MATERIALIZED VIEW IF NOT EXISTS public.match_results
TABLESPACE pg_default
AS
 SELECT soccermatches.user_id,
        CASE
            WHEN (soccermatches.teama_score + soccermatches.teama_score) > (soccermatches.teamb_score + soccermatches.teamb_score) THEN 'Team A'::text
            WHEN (soccermatches.teama_score + soccermatches.teama_score) < (soccermatches.teamb_score + soccermatches.teamb_score) THEN 'Team B'::text
            ELSE 'Draw'::text
        END AS winner
   FROM soccermatches
WITH DATA;

ALTER TABLE IF EXISTS public.match_results
    OWNER TO postgres;
```
```
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_points
TABLESPACE pg_default
AS
 SELECT soccermatches.user_id,
    sum(
        CASE
            WHEN soccermatches.teama_score = (( SELECT admin.teama_score
               FROM admin
              WHERE admin.teama_id = soccermatches.teama_id AND admin.teamb_id = soccermatches.teamb_id)) AND soccermatches.teamb_score = (( SELECT admin.teamb_score
               FROM admin
              WHERE admin.teama_id = soccermatches.teama_id AND admin.teamb_id = soccermatches.teamb_id)) THEN 3
            WHEN soccermatches.winner = (( SELECT admin.winner
               FROM admin
              WHERE admin.teama_id = soccermatches.teama_id AND admin.teamb_id = soccermatches.teamb_id)) THEN 1
            ELSE 0
        END) AS points
   FROM soccermatches
  GROUP BY soccermatches.user_id
WITH DATA;

ALTER TABLE IF EXISTS public.user_points
    OWNER TO postgres;
```



3- Run the project in the cmd by writing
  ```Node FoldarPath/server.js``` 


