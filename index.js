const express = require('express');
const cors = require('cors');
const path = require('path');
const Asana = require('asana');
const { logWorkspaceList, submitDataToSheet } = require('./smartsheet');
const app = express();
const port = process.env.PORT || 8000;
let submittedData = {};

// Initialize Asana client
let client = Asana.ApiClient.instance;
let token = client.authentications['token'];
token.accessToken = process.env.ASANA_ACCESS_TOKEN; // Biztosítsuk, hogy a token helyesen van beállítva

let tasksApiInstance = new Asana.TasksApi();
let projectsApiInstance = new Asana.ProjectsApi();
let usersApiInstance = new Asana.UsersApi();

// Parse JSON bodies
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: 'https://app.asana.com',
}));

// Run before every API request
app.use((req, res, next) => {
  const expirationDate = req.query.expires_at || req.body.expires_at;
  const currentDate = new Date();

  if (currentDate.getTime() > new Date(expirationDate).getTime()) {
    console.log('Request expired.');
    return;
  }

  next();
});

// Function to get task details from Asana
async function getTaskDetails(taskId) {
  let opts = { 
    'opt_fields': "name,projects"
  };

  try {
    const result = await tasksApiInstance.getTask(taskId, opts);
    const task = result.data;
    console.log('Task details:', task); // Log the task details for debugging
    const project = task.projects.length > 0 ? task.projects[0] : null;
    let projectName = '';
    let projectId = '';

    if (project) {
      const projectResult = await projectsApiInstance.getProject(project.gid);
      projectName = projectResult.data.name;
      projectId = project.gid;
    }

    // Split project name into project number and project name
    const [projectNumber, projectTaskName] = projectName.includes(' - ') ? projectName.split(' - ') : [projectName, ''];

    return {
      projectName: projectTaskName || projectName,
      projectId: projectId,
      projectNumber: projectNumber,
      taskName: task.name,
    };
  } catch (error) {
    console.error('Error fetching task details from Asana:', error.message);
    throw error;
  }
}

// Function to get user details from Asana
async function getUserDetails(userId) {
  let opts = { 
    'opt_fields': "email,name"
  };

  try {
    const result = await usersApiInstance.getUser(userId, opts);
    const user = result.data;
    console.log('User details:', user); // Log the user details for debugging

    return {
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error('Error fetching user details from Asana:', error.message);
    throw error;
  }
}

// Function to format date to YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) 
    month = '0' + month;
  if (day.length < 2) 
    day = '0' + day;

  return [year, month, day].join('-');
}

// Client endpoint for auth
app.get('/auth', (req, res) => {
  console.log('Auth happened!');
  res.sendFile(path.join(__dirname, '/auth.html'));
});

// API endpoints
app.get('/form/metadata', async (req, res) => {
  console.log('Modal Form happened!');
  
  // Extract query parameters
  const { user, task } = req.query;

  // Get task details from Asana
  let taskDetails;
  try {
    taskDetails = await getTaskDetails(task);
  } catch (error) {
    return res.status(500).send('Error fetching task details from Asana');
  }

  // Get user details from Asana
  let userDetails;
  try {
    userDetails = await getUserDetails(user);
  } catch (error) {
    return res.status(500).send('Error fetching user details from Asana');
  }

  // Get current date
  const currentDate = formatDate(new Date());

  // Form response with initial values
  const form_response = {
    template: 'form_metadata_v0',
    metadata: {
      title: "Kilóméter költség",
      on_submit_callback: 'https://app-components-example-app.onrender.com/form/submit',
      fields: [
        {
          name: "Projektszám",
          type: "single_line_text",
          id: "ProjectNumber_SL",
          is_required: false,
          placeholder: "[full width]",
          width: "full",
          value: taskDetails.projectNumber, // Set initial value from Asana
        },
        {
          name: "Projektnév",
          type: "single_line_text",
          id: "ProjectName_SL",
          is_required: false,
          placeholder: "[full width]",
          width: "full",
          value: taskDetails.projectName, // Set initial value from Asana
        },
        {
          name: "ASANA TaskName",
          type: "single_line_text",
          id: "AsanaTaskName_SL",
          is_required: false,
          placeholder: "[full width]",
          width: "full",
          value: taskDetails.taskName, // Set initial value from Asana
        },
        {
          name: 'Munkavégző',
          type: 'dropdown',
          id: 'Worker_dropdown',
          is_required: true,
          options: [
            {
              id: userDetails.email,
              label: userDetails.name,
            },
            {
              id: 'vtadam@promir.hu',
              label: 'Varga-Tóth Ádám',
            },
            {
              id: 'banyai.gabor@promir.hu',
              label: 'Bányai Gábor',
            },
          ],
          width: 'half',
        },
        {
          name: 'Rendszám',
          type: 'dropdown',
          id: 'PlateNumber_dropdown',
          is_required: true,
          options: [
            {
              id: 'AEDH-132',
              label: 'AEDH-132',
            },
            {
              id: 'Bömös',
              label: 'Bömös',
            },
          ],
          width: 'half',
        },
        {
          name: 'Munkavégzés Dátuma',
          type: 'date',
          id: 'date',
          is_required: false,
          placeholder: 'Dátum',
          value: currentDate, // Set initial value to current date
        },
        {
          name: "Kilóméter",
          type: "single_line_text",
          id: "Distance_SL",
          is_required: false,
          placeholder: "0",
          width: "half",
        },
        {
          name: "Szerepkör",
          type: "radio_button",
          id: "radio_button",
          is_required: false,
          options: [
            {
              id: "Alapértelmezett",
              label: "Alapértelmezett",
            },
            {
              id: "Programozás",
              label: "Programozás",
            },
            {
              id: "PM",
              label: "PM",
              sub_label: "Semmittevő",
            },
          ],
        },
      ],
      on_change_callback: 'https://app-components-example-app.onrender.com/form/onchange',
    },
  };

  res.json(form_response);
});

app.get('/search/typeahead', (req, res) => {
  console.log('Typeahead happened!');
  res.json(typeahead_response);
});

app.post('/form/onchange', (req, res) => {
  console.log('OnChange happened!');
  console.log(req.body);
  res.json(form_response);
});

app.post('/search/attach', (req, res) => {
  console.log('Attach happened!');
  console.log(req.body);
  res.json(attachment_response);
});

app.post('/form/submit', async (req, res) => { // Aszinkron függvényként definiáljuk
  console.log('Modal Form submitted!');
  console.log('Request Body:', req.body);

  if (req.body.data) {
    try {
      const parsedData = JSON.parse(req.body.data);
      submittedData = parsedData.values || {};
      
      // Log the sheet list to console
      logWorkspaceList();
      
      // Submit the data to Smartsheet
      await submitDataToSheet(3802479470110596, 'ASANA Proba', 'Teszt01', submittedData);
      
    } catch (error) {
      console.log('Error parsing data:', error);
      console.log('Submitted Data:', submittedData);
      res.status(500).send('Error submitting data to Smartsheet');
      return;
    }
  }

  console.log('Submitted Data:', submittedData);
  res.json(attachment_response);
});

const attachment_response = {
  resource_name: "I'm an Attachment",
  resource_url: 'https://app-components-example-app.onrender.com',
};

const typeahead_response = {
  items: [
    {
      title: "I'm a title",
      subtitle: "I'm a subtitle",
      value: 'some_value',
      icon_url: 'https://placekitten.com/16/16',
    },
    {
      title: "I'm a title",
      subtitle: "I'm a subtitle",
      value: 'some_value',
      icon_url: 'https://placekitten.com/16/16',
    },
  ],
};

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
