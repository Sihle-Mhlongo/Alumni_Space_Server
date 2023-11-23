//imports
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

//Express Router
const router = express.Router();

//connecting to database

var client = require('../database/database');
const { password } = require('pg/lib/defaults');

//Middleware
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
// Enable CORS for all routes
router.use(cors());

//Allowing User to upload files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    const fileType = req.body.fileType; // You need to send the file type from the client.

    switch (fileType) {
      case 'profile':
        uploadPath += 'pics/profiles/';
        break;
      case 'event':
        uploadPath += 'pics/events/';
        break;
      case 'academic':
        uploadPath += 'docs/academic/';
        break;
      case 'certificate':
        uploadPath += 'docs/certs/';
        break;
      default:
        uploadPath += 'others/';
        break;
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

//Routes Management
router.post('/api/login', (req, res) => {
  const receivedData = req.body;
  console.log('Received data:', receivedData);

  const selectUserSQL = "SELECT account_id, role FROM Alumni_Space_Account WHERE email = ? AND password = ?";
  var sql;

  client.query(selectUserSQL, [receivedData.email, receivedData.password], function (err, result) {
    if (err) {
      console.error('Error during login:', err);
      //res.status(500).json({ message: 'An error occurred during login.' });
    } else {
      //check details
      if (result && result.length > 0) {
        //get account info
        var account_id = result[0].account_id;
        var role = result[0].role;

        console.log('Account ' + account_id + ' has been found successful!');

        if (role == "Alumni") {
          sql = "SELECT * FROM Tut_Alumni where account_id = ?";
        } else {
          sql = "SELECT * FROM Administrator where account_id = ?";
        }
        //query to get user details
        client.query(sql, [account_id], function (err, result) {
          if (err) {
            throw err;
          } else {
            if (result && result.length > 0) {
              var name = result[0].name;
              console.log("name: " + name);
              //send to front-end
              res.status(200).json({ message: 'Login successful!', result, account_id });
            } else {
              console.log('Invalid email or password');
              res.status(401).json({ message: 'Invalid email or password' });
            }
          }
        });
      } else {
        console.log('Invalid email or password');
        res.status(401).json({ message: 'Invalid email or password' });
      }
    }
  });
});

router.post('/api/register', (req, res) => {
  const receivedData = req.body;
  console.log('Received data:', receivedData);


  // Send a response back to the client
  res.status(200).json({ message: 'Data received on the server', data: receivedData });

  //DATABASE SCRIPTS HERE
  var registerQuery;
  insertDetailsSQL = "INSERT INTO Alumni_Space_Account(email,password,role) " + " VALUES (?,?,?)";
  role = "Alumni";

  if (role == "Alumni") {
    // SQL
    registerQuery =
      "INSERT INTO Tut_Alumni(account_id,name, surname) " + " VALUES (?,?,?)";

    userDetailsFields = [null, receivedData.fullname, receivedData.surname];
  } else if (role == "Admin") {
    // SQL
    registerQuery =
      "INSERT INTO Administrator (name, surname) " + " VALUES (?,?)";

    userDetailsFields = [receivedData.fullname, receivedData.surname];
  }


  //DATABASE INTERACTION STARTS HERE
  // Query insert into Alumni_Space_Account
  client.query(insertDetailsSQL, [receivedData.email, receivedData.password, role], function (err, result) {
    if (err) {
      console.error(err);
      //return res.send("An error occurred during registration.");
    } else {
      console.log('Account for ' + receivedData.fullname + ' ' + receivedData.surname + ' has been Created');
      //inser into relevent table

      //get acc id
      const accountId = result.insertId;
      userDetailsFields[0] = accountId;

      client.query(registerQuery, userDetailsFields, function (err, result) {
        if (err) {
          console.error(err);
          //return res.send("An error occurred during registration.");
        } else {
          //res.send("Registration successful!");
          console.log("Registration successful!");

          //create profile for user
          client.query("INSERT INTO UserProfile(account_id) " + " VALUES(?)", [accountId], function (err, result) {
            if (err) {
              throw err;
            } else {
              console.log("Profile for User " + receivedData.fullname + ' ' + receivedData.surname + ' has been Generated');
            }
          });
        }
      });
    }
  });

});


//  reset the password
// update password 
router.put('/forgot-password', async (req, res) => {
  //const user_id = req.body.user_id;
  const receivedData = req.body;
  //const { email } = req.body.email;

  var email = req.body.email;
  var password = req.body.password;

  // Check if the email exists in the database
  console.log('Received data for updating password:', receivedData);

  const updatePasswordSQL = `UPDATE Alumni_Space_Account SET password = ? WHERE email = ?`;


  client.query(updatePasswordSQL, [password, email], (err, result) => {
    if (err) {
      console.error(err);
      //res.status(500).send('An error occurred during password update.');
    } else {
      console.log('Password updated successfully!');
      res.status(200).json({ message: 'Login successful!' });
    }
  }
  );
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});


// Route to insert a new user profile
router.post('/api/userprofile', (req, res) => {
  //const receivedData = req.body;
  var contact_no = req.body.contact_no;
  var education = req.body.education;
  var achievement = req.body.achievement;
  var skills = req.body.skills;
  var experience = req.body.experience;
  var interest = req.body.interest;
  var bio = req.body.bio;
  // Handle the data on the server as needed
  //console.log('Received data:', receivedData);

  // Send a response back to the client
  //res.status(200).json({ message: 'Data received on the server', data: receivedData });

  // SQL query to insert into UserProfile table

  const insertProfileSQL = `
    INSERT INTO UserProfile (contact_no, education, achievement, skills, experience, enterest, bio) VALUES (?,?,?,?,?,?,?)`;
  //const {achievement, skills, experience, interest, bio } = receivedData;
  console.log(receivedData.education);

  client.query(insertProfileSQL, [contact_no, education, achievement, skills, experience, interest, bio], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred during profile insertion.');
    } else {
      console.log('Profile inserted successfully!');
    }
  });
});

function toInitCap(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

//updating profile
router.put('/api/userprofile/:user_id', (req, res) => {
  const user_id = req.body.user_id;
  const receivedData = req.body;

  var location = toInitCap(req.body.location);
  var qualification = toInitCap(req.body.qualification);
  var employment_status = toInitCap(req.body.employment_status);
  const skills = Array.isArray(req.body.skills) ? req.body.skills.join(', ') : '';
  var experience = req.body.experience;
  var interest = toInitCap(req.body.interest);
  var bio = toInitCap(req.body.bio);


  // Handle the data on the server as needed
  console.log('Received data for updating profile:', receivedData);

  // Send a response back to the client
  res.status(200).json({ message: 'Data received on the server for updating profile', data: receivedData });

  // SQL query to update UserProfile table by user_id
  const updateProfileSQL = `UPDATE UserProfile SET location = ?, qualification = ?, employment_status = ?, skills = ?, experience = ?, interest = ?, bio = ? WHERE account_id = ? `;

  //const { contact_no, education, achievement, skills, experience, interest, bio } = updatedData;

  client.query(
    updateProfileSQL,
    [location, qualification, employment_status, skills, experience, interest, bio, user_id],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('An error occurred during profile update.');
      } else {
        console.log('Profile updated successfully!');
      }
    }
  );
});

//Get a user profile by user_id
router.put('/api/userprofile', (req, res) => {
  //const user_id = req.params.user_id;

  var user_id = req.body.user_id;

  // SQL query to retrieve a user profile by user_id
  const getProfileSQL = `SELECT * FROM UserProfile WHERE account_id = ?`;

  client.query(getProfileSQL, [user_id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching the user profile.');
    } else {
      if (result && result.length > 0) {
        const userProfile = result[0];
        res.status(200).json({ message: 'User profile retrieved successfully', result });
      } else {
        res.status(404).send('User profile not found.');
      }
    }
  });
});


//selecting all userprofiles

router.get('/api/profiles', (req, res) => {
  // SQL query to select profiles with names from Tut_Alumni and additional information from UserProfile
  const selectProfilesSQL = `
    SELECT ta.name, ta.surname, up.*
    FROM Tut_Alumni ta
    JOIN UserProfile up ON ta.account_id = up.account_id
  `;

  client.query(selectProfilesSQL, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching profiles.');
    } else {
      if (result && result.length > 0) {
        var profilePictures = [];

        for (let i = 0; i < result.length; i++) {
          if (result[i].pic_file === '') {
          } else {
            profilePictures.push({ filePath: result[i].pic_file });
          }
        }

        res.status(200).json({ profiles: result, profilePictures: profilePictures });
      } else {
        res.status(404).send('No profiles found.');
      }
    }
  });
});






// Route to insert a new job
router.post('/api/newjob', (req, res) => {

  var job_title = req.body.job_title;
  var Organisation = req.body.Organisation;
  var workplace_type = req.body.workplace_type;
  var location = req.body.location;
  var job_type = req.body.job_type;
  var job_description = req.body.job_description;
  var date_posted = req.body.date_posted;
  var deadline = req.body.deadline;
  var experience = req.body.experience;
  var required_Skills = req.body.required_Skills;
  var salary = req.body.salary;

  console.log(job_title);
  console.log(Organisation);
  console.log(workplace_type);
  console.log(location);
  console.log(job_type);
  console.log(job_description);
  console.log(date_posted);
  console.log(deadline);
  console.log(experience);
  console.log(required_Skills);
  console.log(salary);



  // Handle the data on the server as needed

  // SQL query to insert into Jobs table
  const insertJobSQL = `INSERT INTO joblisting (job_title, Organisation, workplace_type, location, job_type, job_description,experience, required_Skills, salary,date_posted,deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  client.query(
    insertJobSQL,
    [job_title, Organisation, workplace_type, location, job_type, job_description, experience, required_Skills, salary, new Date(), deadline],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('An error occurred during job insertion.');
      } else {
        console.log('Job inserted successfully!');
        res.status(200).json({ message: 'Job inserted successfully!' });
      }
    }
  );
});


//updating jobs
router.put('/api/Jobs/:job_id', (req, res) => {
  const job_id = req.params.job_id;
  const receivedData = req.body;

  var job_type = req.body.job_type;
  var job_title = req.body.job_title;
  var organisation = req.body.organisation;
  var job_description = req.body.job_description;
  var location = req.body.location;
  var deadline = req.body.deadline;
  var workplace_type = req.body.workplace_type;
  var experience = req.body.experience;
  var required_Skills = req.body.required_Skills;
  var salary = req.body.salary;

  // Handle the data on the server as needed
  console.log('Received data for updating job:', receivedData);

  // Send a response back to the client
  res.status(200).json({ message: 'Data received on the server for updating job', data: receivedData });

  // SQL query to update Job table by job_id
  const updateJobSQL = `UPDATE joblisting SET job_title = ?, organisation = ?, location = ?, workplace_type = ? , job_type = ?, job_description, deadline = ?, experience = ?, required_Skills = ?, salary =?, WHERE job_id = ? `;


  client.query(
    updateJobSQL,
    [job_title, organisation, location, workplace_type, job_type, job_description, deadline, experience, required_Skills, salary, job_id],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('An error occurred during job update.');
      } else {
        console.log('Job updated successfully!');
      }
    }
  );
});


//deleting a job
router.delete('/api/job/delete/:job_id', (req, res) => {
  const job_id = req.params.job_id;
  console.log(job_id);
  // SQL query to delete a job by its ID
  const deleteJobSQL = 'DELETE FROM joblisting WHERE job_id = ?';

  client.query(deleteJobSQL, [job_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'An error occurred during job deletion.' });
    } else {
      if (result.affectedRows > 0) {
        console.log('Job deleted successfully!');
        return res.status(200).json({ message: 'Job deleted successfully.' });
      } else {

        return res.status(404).json({ message: 'Job not found.' });
      }
    }
  });
});

//getting job by its id

router.get('/api/job/:id', (req, res) => {
  const jobId = req.params.id;
  console.log(jobId);

  // SQL query to select a job by its ID
  const selectJobSQL = 'SELECT * FROM joblisting WHERE job_id = ?';

  client.query(selectJobSQL, [jobId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching the job id.');
    } else {
      if (result && result.length > 0) {
        //console.log("something");
        const user = result[0];
        res.status(200).json({ message: 'Job id retrieved successfully', data: user });
      } else {
        res.status(404).send('Job not found.');
      }
    }
  });
});

//selecting all jobs

// const insertApplicationSQL =`
//   SELECT ta.name, ta.surname, up.*
//   FROM Tut_Alumni ta
//   JOIN savejob up ON ta.account_id = up.alumni_id
// `;

router.get('/api/jobs', (req, res) => {
  // SQL query to select all jobs
  const selectAllJobsSQL = 'SELECT * FROM joblisting';

  client.query(selectAllJobsSQL, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching jobs.');
    } else {
      if (result && result.length > 0) {
        res.status(200).json({ jobs: result });
      }
    }
  });
});

//search jobs
router.post('/api/search/jobs', (req, res) => {
  const { job_type, location, date_posted } = req.body;

  // SQL query to search for jobs based on the provided parameters
  const searchJobsSQL = 'SELECT * FROM joblisting WHERE job_type = ? AND location = ? AND date_posted = ?';

  client.query(searchJobsSQL, [job_type, location, date_posted], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching the job id.');
    } else {
      if (result && result.length > 0) {
        //console.log("something");
        const user = result[0];
        console.log(result);
        res.status(200).json({ message: 'Job id retrieved successfully', result });
      } else {
        res.status(404).send('Job not found.');
      }
    }
  });
});

//auto deleting job
router.delete('/api/deletejobs', (req, res) => {

  const selectAllJobsSQL = 'SELECT * FROM joblisting';

  client.query(selectAllJobsSQL, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching jobs.');
    } else {
      if (result && result.length > 0) {
        const currentTime = new Date();
        console.log(currentTime);
        //loop all the jobs
        for (let i = 0; i < result.length; i++) {
          //check if job is expiring
          const jobDeadline = new Date(result[i].deadline);
          console.log(jobDeadline);

          if (currentTime >= jobDeadline) {

            const deleteJobSQL = 'DELETE FROM joblisting WHERE job_id = ?';
            client.query(deleteJobSQL, [result[i].job_id], (err, result) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: 'An error occurred during job deletion.' });
              }
              console.log('Job deleted successfully: ');
            });
          } else {
            console.log('Job ' + result[i].job_title + ' is not expiring today.');
          }
        }
        res.json({ message: 'Expired jobs will be deleted' });
      } else {
        res.json({ message: 'No expired jobs to delete' });
      }
    }
  });
});


//count all available jobs
router.get('/api/count_job', (req, res) => {
  // MySQL query to count alumni
  const query = 'SELECT COUNT(*) AS job_count FROM joblisting';

  client.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving Job count:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const jobCount = results[0].job_count;
    res.json({ job_count: jobCount });
  });
});

//save jobs

// Assuming you're using Express.js
router.post('/api/applyjob', (req, res) => {
  var alumni_id = req.body.alumni_id;
  var job_title = req.body.job_title;
  var job_description = req.body.job_description;
  var application_date = new Date();

  console.log(alumni_id);
  console.log(job_title);
  console.log(job_description);
  console.log(application_date);

  // Handle the data on the server as needed

  // SQL query to insert into Applications table
const insertApplicationSQL = `INSERT INTO savejob (alumni_id, job_title, job_description, application_date) VALUES ( ?, ?, ?, ?)`;
  

  client.query(
    insertApplicationSQL,
    [alumni_id, job_title, job_description, application_date],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('An error occurred during application insertion.');
      } else {
        console.log('Application inserted successfully!');
        res.status(200).json({ message: 'Application inserted successfully!' });
      }
    }
  );
});

//select all saved jobs
router.get('/api/alumni', (req, res) => {
  const query = `SELECT  a.alumni_id, a.name, a.surname, j.Organisation, j.job_title as job_applied_for, j.job_description, j.date_posted, j.deadline, j.experience as job_experience, j.required_Skills, j.salary, s.account_id, s.job_title as saved_job_title, s.job_description as saved_job_description, s.application_date FROM Tut_Alumni a LEFT JOIN JobListing j ON a.account_id = j.account_id LEFT JOIN savejob s ON a.account_id = s.account_id`;

  client.query(query, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching jobs.');
    } else {
      if (result && result.length > 0) {
        res.status(200).json({ jobs: result });
      } else {
        res.status(404).json({ message: 'No saved jobs found.' });
      }
    }
  });
});




//Add Event
router.post('/api/event', upload.single('file'), function (req, res) {
  var event_title = req.body.event_title;
  var event_description = req.body.event_description;
  var event_date = req.body.event_date;
  var date_posted = new Date();

  //var
  var insertEventSQL;
  var values;


  if (!req.file) {
    //if event pic is null

    insertEventSQL = `INSERT INTO Event (event_title, event_description, date_posted, event_date) VALUES (?, ?, ?, ?)`;
    values = [event_title, event_description, date_posted, event_date];

  } else {
    insertEventSQL = `INSERT INTO Event (event_title, event_description, date_posted, event_date, event_file) VALUES (?, ?, ?, ?, ?)`;
    values = [event_title, event_description, date_posted, event_date, req.file.originalname];

    //imag var
    const picturePath = req.file.path;
    let uploadDirectory = 'uploads/pics/events/';

    //SAVE event image on database
    fs.rename(picturePath, uploadDirectory + req.file.originalname, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error saving picture to the server' });
      }
    });

  }
  // SQL query to insert into Events table
  client.query(
    insertEventSQL, values,
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('An error occurred during event insertion.');
      } else {
        console.log('Event inserted successfully!');
        res.status(200).json({ message: 'Event and file information saved successfully!' });
      }
    }
  );
});


//Get
router.get('/api/event/:id', function (req, res) {
  var eventId = req.body.eventId;


  // SQL query to select a job by its ID
  const selectJobSQL = 'SELECT * FROM Event WHERE event_id = ?';

  client.query(selectJobSQL, [eventId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching the job id.');
    } else {
      if (result && result.length > 0) {
        //console.log("something");
        const user = result[0];
        res.status(200).json({ message: 'Event id retrieved successfully', data: user });
      } else {
        res.status(404).send('Event not found.');
      }
    }
  });
});

//Get all events
router.get('/api/events', (req, res) => {
  // SQL query to select all events
  const selectAllEventsSQL = 'SELECT * FROM Event';

  client.query(selectAllEventsSQL, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching Events.');
    } else {
      if (result && result.length > 0) {
        var pictures = [];

        for (let i = 0; i < result.length; i++) {
          if (result[i].event_file === '') {
            console.log('Event has no picture');
          } else {
            pictures.push({ filePath: result[i].event_file });
          }
        }

        res.json({ events: result, pictures: pictures });
      } else {
        res.json({ events: [] }); // Return an empty array if there are no events
      }
    }
  });
});


//updating events
router.put('/api/event/:event_id', (req, res) => {
  const event_id = req.body.event_id;
  const receivedData = req.body;

  // var alumni_id = req.body.alumni_id;
  var event_title = req.body.event_title;
  var event_description = req.body.event_description;
  var event_date = req.body.event_date;


  // Handle the data on the server as needed
  console.log('Received data for updating event:', receivedData);

  // Send a response back to the client
  res.status(200).json({ message: 'Data received on the server for updating event', data: receivedData });

  // SQL query to update Job table by job_id
  const updateEventSQL = `UPDATE Event SET event_title = ?, event_description = ?, event_date = ? WHERE event_id = ?`;

  client.query(
    updateEventSQL,
    [event_title, event_description, event_date, event_id],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('An error occurred during event update.');
      } else {
        console.log('Event updated successfully!');
      }
    }
  );
});

//deleting an event
router.delete('/api/event/delete/:event_id', (req, res) => {
  const event_id = req.params.event_id;
  console.log(event_id);

  const deleteEventSQL = 'DELETE FROM Event WHERE event_id = ?';

  client.query(deleteEventSQL, [event_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'An error occurred during Event deletion.' });
    } else {
      if (result.affectedRows > 0) {
        console.log('Event deleted successfully!');
        return res.status(200).json({ message: 'Event deleted successfully.' });
      } else {

        return res.status(404).json({ message: 'Event not found.' });
      }
    }
  });
});


//auto deleting event
router.delete('/api/deleteEvent', (req, res) => {

  const selectAllEventsSQL = 'SELECT * FROM Event';

  client.query(selectAllEventsSQL, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while fetching Event.');
    } else {
      if (result && result.length > 0) {
        const currentTime = new Date();
        console.log(currentTime);
        //loop all the jobs
        for (let i = 0; i < result.length; i++) {
          //check if job is expiring
          const eventDeadline = new Date(result[i].deadline);
          console.log(eventDeadline);

          if (currentTime >= eventDeadline) {

            const deleteEventSQL = 'DELETE FROM Event WHERE event_id = ?';
            client.query(deleteEventSQL, [result[i].event_id], (err, result) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: 'An error occurred during Event deletion.' });
              }
              console.log('Event deleted successfully: ');
            });
          } else {
            console.log('Event ' + result[i].event_title + ' is not expiring today.');
          }
        }
        res.json({ message: 'Expired Event will be deleted' });
      } else {
        res.json({ message: 'No expired Event to delete' });
      }
    }
  });
});



//count all available events
router.get('/api/count_event', (req, res) => {
  // MySQL query to count alumni
  const query = 'SELECT COUNT(*) AS event_count FROM Event';

  client.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving event count:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const eventCount = results[0].event_count;
    res.json({ event_count: eventCount });
  });
});



//Upload Documents
router.post('/api/upload', upload.single('file_name'), (req, res) => {
  console.log('Saving file....');
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const picturePath = req.file.path;

  // Get the file type from the request body
  const fileType = req.body.fileType;

  let uploadDirectory = 'uploads/others/'; // Default directory if fileType is not recognized

  //Variables
  var sql = '';
  var id = '';

  switch (fileType) {
    case 'profile':
      uploadDirectory = 'uploads/pics/profiles/';
      sql = 'UPDATE userprofile SET pic_file = ? WHERE account_id = ?';
      id = req.body.account_id;
      break;
    case 'event':
      uploadDirectory = 'uploads/pics/events/';
      sql = 'UPDATE event SET event_file = ? WHERE event_id = ?';
      id = req.body.event_id;
      break;
    case 'post':
      uploadDirectory = 'uploads/posts/';
      break;
    case 'academic':
      uploadDirectory = 'uploads/docs/academic/';
      break;
    case 'certificate':
      uploadDirectory = 'uploads/docs/certs/';
      break;

  }

  // Save file to the relevent folder
  fs.rename(picturePath, uploadDirectory + req.file.originalname, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error saving picture to the server' });
    }
  });


  //Update Database
  client.query(sql, [req.file.originalname, id], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    } else {
      res.json({ success: true, message: fileType + ' uploaded and saved successfully' });
    }
  });

});

//Folder to serve(save) on
//router.use('/uploads', express.static(__dirname + '/uploads'));
//router.use('/uploads', express.static(path.join(__dirname, 'uploads')));
router.use('/uploads', express.static('uploads'));

//GET Documents
router.get('/api/getDocument/:fileType/:id', (req, res) => {
  //var account_id = req.body.accounid;
  var sql;

  switch (req.params.fileType) {
    case 'profile':
      sql = 'SELECT pic_file FROM userprofile WHERE account_id = ? ';
      break;
    case 'event':
      sql = 'SELECT event_file FROM event WHERE account_id = ? ';
      break;
    case 'post':
      uploadDirectory = 'uploads/posts/';
      break;
    case 'academic':
      uploadDirectory = 'uploads/docs/academic/';
      break;
    case 'certificate':
      uploadDirectory = 'uploads/docs/certs/';
      break;

  }

  client.query(sql, req.params.id, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching pictures' });
    } else {
      const pictures = results.map((result) => ({ filePath: result.pic_file }));
      console.log(pictures);
      res.json(pictures);
    }
  });
});

//count all available alumni
router.get('/api/count_alumni', (req, res) => {
  // MySQL query to count alumni
  const query = 'SELECT COUNT(*) AS alumni_count FROM Tut_Alumni';

  client.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving alumni count:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const alumniCount = results[0].alumni_count;
    res.status(200).json({ alumni_count: alumniCount });
  });
});



//API for sending Query
router.post('/api/send_query', (req, res) => {

  const { account_id, query_text, status, date } = req.body;
  const insertQuery = 'INSERT INTO Query (account_id, query_text, status, date) VALUES (?, ?, ?, ?)';
  client.query(insertQuery, [account_id, query_text, status, date], (err, results) => {
    if (err) {
      console.error('Error inserting query:', err);
      res.status(500).json({ error: 'Error inserting query' });
    } else {
      console.log('Query inserted successfully');
      res.json({ success: true });
    }

  });
});

//responding query
router.post('/api/respond_query', (req, res) => {

  const { query_id, query_text } = req.body;
  const updatetQuery = 'UPDATE Query SET status = "Completed", query_text = ? WHERE query_id = ?';
  client.query(updatetQuery, [query_text, query_id], (err, results) => {
    if (err) {
      console.error('Error updating query:', err);
      res.status(500).json({ error: 'Error updating query' });
    } else {
      console.log('Query responded successfully');
      res.json({ success: true });
    }

  });
});



//Connections
//1.Create Connection
router.post('/api/connections', (req, res) => {
  const { follower_id, following_id, status } = req.body;

  // Check if the connection exists
  client.query(
    'SELECT * FROM Connection WHERE follower_id = ? AND following_id = ?',
    [follower_id, following_id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Connection already exists.' });
      }

      // Create a new connection
      client.query(
        'INSERT INTO Connection (follower_id, following_id, status) VALUES (?, ?, ?)',
        [follower_id, following_id, status],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }

          return res.status(201).json({ connection_id: result.insertId });
        }
      );
    }
  );
});

// 2. Count Number of Followers
router.get('/api/followers/:account_id/count', (req, res) => {
  const account_id = req.params.account_id;

  // Count the number of followers
  client.query(
    'SELECT COUNT(*) as followerCount FROM Connection WHERE following_id = ?',
    [account_id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

      const followerCount = results[0].followerCount;

      return res.json({ followerCount });
    }
  );
});

// 3. Count Number of Following
router.get('/api/following/:account_id/count', (req, res) => {
  const account_id = req.params.account_id;

  // Count the number of following
  client.query(
    'SELECT COUNT(*) as followingCount FROM Connection WHERE follower_id = ?',
    [account_id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

      const followingCount = results[0].followingCount;

      return res.json({ followingCount });
    }
  );
});

// 4. Update Connection Status
router.patch('/api/connections/:connection_id/status', (req, res) => {
  const connection_id = req.params.connection_id;
  const { status } = req.body;

  // Update the connection status
  client.query(
    'UPDATE Connection SET status = ? WHERE connection_id = ?',
    [status, connection_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Connection not found.' });
      }

      return res.json({ message: 'Connection status updated successfully.' });
    }
  );
});




module.exports = router;

