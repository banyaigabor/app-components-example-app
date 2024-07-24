const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 8000;
let submittedData = {};

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

// Client endpoint for auth
app.get('/auth', (req, res) => {
  console.log('Auth happened!');
  res.sendFile(path.join(__dirname, '/auth.html'));
});

// API endpoints
app.get('/widget', (req, res) => {
  console.log('Widget happened!');
  const updatedWidgetResponse = {
    template: 'summary_with_details_v0',
    metadata: {
      fields: [
        {
          name: 'Dátum',
          type: 'datetime_with_icon',
          datetime: submittedData.date || 'No data',
        },
        {
          name: 'Munkavégző',
          type: 'text_with_icon',
          text: submittedData.Worker_dropdown || 'No data',
        },
        {
          name: 'Munkavégző',
          type: 'text_with_icon',
          text: submittedData.Worker_dropdown || 'No data',
        },
      ],
      footer: {
        footer_type: 'custom_text',
        icon_url: 'https://example-icon.png',
        text: "I'm a footer",
      },
      num_comments: 2,
      subicon_url: 'https://placekitten.com/16/16',
      subtitle: "I'm a subtitle",
      title: 'KM költség',
    },
  };

  res.json(updatedWidgetResponse);
});

app.get('/form/metadata', (req, res) => {
  console.log('Modal Form happened!');
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

app.post('/form/submit', (req, res) => {
  console.log('Modal Form submitted!');
  console.log('Request Body:', req.body);

  if (req.body.data) {
    try {
      const parsedData = JSON.parse(req.body.data);
      submittedData = parsedData.values || {};
    } catch (error) {
      console.log('Error parsing data:', error);
    }
  }

  console.log('Submitted Data:', submittedData);
  res.json(attachment_response);
});

const attachment_response = {
  resource_name: "I'm an Attachment",
  resource_url: 'https://app-components-example-app.onrender.com',
};

const widget_response = {
  template: 'summary_with_details_v0',
  metadata: {
    fields: [
      {
        name: 'Dátum',
        type: 'datetime_with_icon',
        datetime: '2012-02-22T02:06:58.147Z',
        icon_url: 'https://placekitten.com/16/16',
      },
      {
        name: 'Név',
        type: 'text_with_icon',
        text: "I'm text",
      },
      {
        name: 'Rendszám',
        type: 'text_with_icon',
        text: "I'm text",
      },
      {
        name: 'Kilóméter',
        type: 'pill',
        text: "I'm text",
        color: 'hot-pink',
      },
    ],
    footer: {
      footer_type: 'custom_text',
      icon_url: 'https://example-icon.png',
      text: "I'm a footer",
    },
    num_comments: 2,
    subicon_url: 'https://placekitten.com/16/16',
    subtitle: "I'm a subtitle",
    title: 'KM költség',
  },
};

const form_response = {
  template: 'form_metadata_v0',
  metadata: {
    title: "I'm a title",
    on_submit_callback: 'https://app-components-example-app.onrender.com/form/submit',
    fields: [
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
            icon_url: 'https://placekitten.com/16/16',
          },
        ],
        width: 'half',
      },
      {
        name: 'Munkavégzés Dátuma',
        type: 'date',
        id: 'date',
        is_required: false,
        placeholder: '[placeholder]',
      },
    ],
    on_change_callback: 'https://app-components-example-app.onrender.com/form/onchange',
  },
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
