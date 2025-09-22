# TASA Bloom
Welcome to TASA's internal platform Bloom. This is an all in one platform 

## Database & Schema
The database 

## Local Developement
This platform is built on a tech stack of React, TypeScript, and NextJS. The entire database is hosted via a Postgres Database on Supabase. This entire repo was prebuilt using a simple scaffolding template provided by NextJS and Supabase. As a result there are many prebuilt functions that are written and rules you must adhear to like linting and route rules. Generally you can just clone the repo and run a simple `npm run dev` to start local development. You will need to populate an enviornment file similar to the one below.

You should request the env secrets from someone who would previously have these credentials.
```
NEXT_PUBLIC_SUPABASE_URL=abc.com
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=abc
```

Due to the scaffolding of the project, the local instance of Bloom running on your machine connects to the production database hosted on Supabase. This comes with the benefits of not needing new account credentials to login. However, this does mean that all the data from real Junior Officer Selection Cohorts are all present when in development. It is important to be very careful when making any type of live change to the DB Schema as any slight change could delete large amounts of historical data. 

### Making changes and updates
Due to the scaffolding and various checks put, your inital changes might not properly deploy. Make sure to run `npm run build` before pushing any changes to github to enure that your changes will properly compile and build. 