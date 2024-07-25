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
    return {
      projectName: project ? project.name : '',
      projectId: project ? project.gid : '',
      taskName: task.name,
    };
  } catch (error) {
    console.error('Error fetching task details from Asana:', error.message);
    throw error;
  }
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
  const { task } = req.query;

  // Get task details from Asana
  let taskDetails;
  try {
    taskDetails = await getTaskDetails(task);
  } catch (error) {
    return res.status(500).send('Error fetching task details from Asana');
  }

  // Form response with initial values
  const form_response = {
    template: 'form_metadata_v0',
    metadata: {
      title: "I'm a title",
      on_submit_callback: 'https://app-components-example-app.onrender.com/form/submit',
      fields: [
        {
          name: "Projektszám",
          type: "single_line_text",
          id: "ProjectNumber_SL",
          is_required: false,
          placeholder: "[full width]",
          width: "full",
          value: taskDetails.projectId, // Set initial value from Asana
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
              id: '1',
              label: 'Bányai Gábor',
            },
            {
              id: '2',
              label: 'Varga-Tóth Ádám',
              icon_url: '/image/adam.jpg'
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
              id: "1",
              label: "Alapértelmezett",
            },
            {
              id: "2",
              label: "Programozás",
            },
            {
              id: "3",
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
