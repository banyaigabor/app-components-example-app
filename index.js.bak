const express = require("express");
const https = require("https");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 8000;
const crypto = require("crypto");
let submittedData = {}; 

// Parse JSON bodies
app.use(express.json());

// Enable CORS (https://developers.asana.com/docs/security)
app.use(
  cors({
    origin: "https://app.asana.com",
  })
);

// Run before every API request
app.use((req, res, next) => {
  // Assess timeliness (https://developers.asana.com/docs/timeliness)
  const expirationDate = req.query.expires_at || req.body.expires_at;
  const currentDate = new Date();

  if (currentDate.getTime() > new Date(expirationDate).getTime()) {
    console.log("Request expired.");
    return;
  }

  next();
});

// -------------------- Client endpoint for auth (see auth.html) --------------------

app.get("/auth", (req, res) => {
  console.log("Auth happened!");
  res.sendFile(path.join(__dirname, "/auth.html"));
});

// -------------------- API endpoints --------------------

// Docs: https://developers.asana.com/docs/get-widget-metadata
app.get("/widget", (req, res) => {
  console.log("Widget happened!");
 // console.log("Request Body:", req);
  // Update the widget_response with submittedData
  const updatedWidgetResponse = {
    template: "summary_with_details_v0",
    metadata: {
      fields: [
        {
          name: "Dátum",
          type: "datetime_with_icon",
          datetime: submittedData.date || "No data",
          
        },
        {
          name: "Munkavégző",
          type: "text_with_icon",
          text: submittedData.Worker_dropdown || "No data",
        },
        {
          name: "Munkavégző",
          type: "text_with_icon",
          text: submittedData.Worker_dropdown || "No data",
        },
      ],
	  
	  
      footer: {
        footer_type: "custom_text",
        icon_url: "https://example-icon.png",
        text: "I'm a footer"
      },
      num_comments: 2,
      subicon_url: "https://placekitten.com/16/16",
      subtitle: "I'm a subtitle",
      title: "KM költség",
    },
  };

  res.json(updatedWidgetResponse);
});

// Docs: https://developers.asana.com/docs/get-form-metadata
app.get("/form/metadata", (req, res) => {
  console.log("Modal Form happened!");
  res.json(form_response);
});

// Docs: https://developers.asana.com/docs/get-lookup-typeahead-results
app.get("/search/typeahead", (req, res) => {
  console.log("Typeahead happened!");
  res.json(typeahead_response);
});

// Docs: https://developers.asana.com/docs/on-change-callback
app.post("/form/onchange", (req, res) => {
  console.log("OnChange happened!");
  console.log(req.body);
  res.json(form_response);
});

// Docs: https://developers.asana.com/docs/attach-resource
app.post("/search/attach", (req, res) => {
  console.log("Attach happened!");
  console.log(req.body);
  res.json(attachment_response);
});

// Docs: https://developers.asana.com/docs/on-submit-callback
app.post("/form/submit", (req, res) => {
  console.log("Modal Form submitted!");
  console.log("Request Body:", req.body);

  // Parse the `data` property if it exists
  if (req.body.data) {
    try {
      const parsedData = JSON.parse(req.body.data);
      submittedData = parsedData.values || {};
    } catch (error) {
      console.log("Error parsing data:", error);
    }
  }

  console.log("Submitted Data:", submittedData);


  res.json(attachment_response);
});

// -------------------- Metadata responses --------------------
// Note that values should be computed based on business logic

attachment_response = {
  resource_name: "I'm an Attachment",
  resource_url: "https://localhost:8000",
};

// Docs: https://developers.asana.com/docs/widget
widget_response = {
  template: "summary_with_details_v0",
  metadata: {
    fields: [
      {
        name: "Dátum",
        type: "datetime_with_icon",
        datetime: "2012-02-22T02:06:58.147Z",
        icon_url: "https://placekitten.com/16/16",
      },
      {
        name: "Név",
        type: "text_with_icon",
        text: "I'm text",
      },
      {
        name: "Rendszám",
        type: "text_with_icon",
        text: "I'm text",
      },
      {
        name: "Kilóméter",
        type: "pill",
        text: "I'm text",
        color: "hot-pink",
      },
    ],
    footer: {
      footer_type: "custom_text",
      icon_url: "https://example-icon.png",
      text: "I'm a footer"
    },
    num_comments: 2,
    subicon_url: "https://placekitten.com/16/16",
    subtitle: "I'm a subtitle",
    title: "KM költség",
  },
};

// Docs: https://developers.asana.com/docs/modal-form
form_response = {
  template: "form_metadata_v0",
  metadata: {
    title: "I'm a title",
    on_submit_callback: "https://localhost:8000/form/submit",
    fields: [
      {
        name: "Munkavégző",
        type: "dropdown",
        id: "Worker_dropdown",
        is_required: true,
        options: [
          {
            id: "1",
            label: "Bányai Gábor",
          },
          {
            id: "2",
            label: "Varga-Tóth Ádám",
            icon_url: "https://placekitten.com/16/16",
          },
        ],
        width: "half",
      },
      {
        name: "Munkavégzés Dátuma",
        type: "date",
        id: "date",
        is_required: false,
        placeholder: "[placeholder]",
      },
    ],
    on_change_callback: "https://localhost:8000/form/onchange",
  },
};

typeahead_response = {
  items: [
    {
      title: "I'm a title",
      subtitle: "I'm a subtitle",
      value: "some_value",
      icon_url: "https://placekitten.com/16/16",
    },
    {
      title: "I'm a title",
      subtitle: "I'm a subtitle",
      value: "some_value",
      icon_url: "https://placekitten.com/16/16",
    },
  ],
};

https
  .createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app
  )
  .listen(port, function () {
    console.log(
      `Example app listening on port ${port}! Go to https://localhost:${port}/`
    );
  });
