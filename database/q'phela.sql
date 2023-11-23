Create DATABASE Alumni_Space_DB;

CREATE TABLE Alumni_Space_Account (
    account_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE, -- Added UNIQUE constraint
    password VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL
);

CREATE TABLE Tut_Alumni (
    alumni_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES Alumni_Space_Account(account_id),
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL
);

CREATE TABLE Administrator (
    admin_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES Alumni_Space_Account(account_id),
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL
);

--Profile

--Profile

CREATE TABLE UserProfile(
    user_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES Alumni_Space_Account(account_id),
    contact_no VARCHAR(50) NOT NULL,
    education VARCHAR(100) NOT NULL,
    achievement VARCHAR(50) NOT NULL,
    skills VARCHAR(50) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    interest VARCHAR(50) NOT NULL,
    bio VARCHAR(50) NOT NULL,
);

                             


CREATE TABLE UserStory(
    user_id SERIAL PRIMARY KEY,
    alumni_id INT REFERENCES Alumni_Space_Account(account_id) ,
    story_type VARCHAR(50) NOT NULL,
    story_text VARCHAR(50) NOT NULL,
    date_posted Date
    
);


CREATE TABLE JobListing(
    job_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES Alumni_Space_Account(account_id),
    Organisation VARCHAR(50) NOT NULL,
    job_title VARCHAR(50) NOT NULL,
    workplace_type VARCHAR(50) NOT NULL,
    location VARCHAR(50) NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    job_description VARCHAR(255) NOT NULL,
    date_posted DATETIME,
    deadline DATETIME,
    experience VARCHAR(255) NOT NULL,
    required_Skills VARCHAR(255) NOT NULL,
    salary NUMBER
);


CREATE TABLE Event(
    event_id SERIAL PRIMARY KEY,
    alumni_id INT REFERENCES Alumni_Space_Account(account_id) ,
    event_title VARCHAR(50) NOT NULL,
    event_description VARCHAR(100) NOT NULL,
    date_posted DateTime,
    event_date DateTime,
    deadline DateTime,
    pic_file VARCHAR(255) NOT NULL
);


CREATE TABLE Connection (
    connection_id SERIAL PRIMARY KEY,
    follower_id INT REFERENCES Alumni_Space_Account(account_id),
    following_id INT REFERENCES Alumni_Space_Account(account_id),
    status VARCHAR(100) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





CREATE TABLE Notification(
    notification_id SERIAL PRIMARY KEY,
    job_id INT REFERENCES Alumni_Space_Account(job_id) ,
    event_id INT REFERENCES Alumni_Space_Account(event_id) ,
    subject VARCHAR(50) NOT NULL,
    message VARCHAR(50) NOT NULL,
    date Date
    
);

--Linda's
CREATE TABLE `message` (
  `idmessage` int NOT NULL AUTO_INCREMENT,
  `text` varchar(255) NOT NULL,
  `date` varchar(45) DEFAULT NULL,
  `sender` varchar(45) NOT NULL,
  `room` varchar(45) NOT NULL,
  PRIMARY KEY (`idmessage`)
);

CREATE TABLE `post` (
  `idpost` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(45) NOT NULL,
  `user_postion` varchar(45) NOT NULL,
  `institution` varchar(45) NOT NULL,
  `post_time` varchar(45) NOT NULL,
  `text_message` varchar(45) NOT NULL,
  PRIMARY KEY (`idpost`)
);

CREATE TABLE `user` (
  `id` int NOT NULL,
  `email` varchar(45) NOT NULL,
  `password` varchar(45) NOT NULL,
  `name` varchar(45) NOT NULL,
  `role` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  UNIQUE KEY `id_UNIQUE` (`id`)
);

CREATE TABLE Chat(
    chat_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Alumni_Space_Account(user_id) ,
    notification_id INT REFERENCES Alumni_Space_Account(notification_id) ,
    attribute_name VARCHAR(50) NOT NULL,
    message VARCHAR(50) NOT NULL,
    time TimeStamp,
    chat_history VARCHAR(50) NOT NULL
    
);

CREATE TABLE Query(
    query_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES Alumni_Space_Account(account_id),
    query_text VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    date DATETIME
);


CREATE TABLE savejob (
    savejob_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES Alumni_Space_Account(account_id),
    job_title VARCHAR(50) NOT NULL,
    job_description VARCHAR(50) NOT NULL,
    application_date DATETIME
);