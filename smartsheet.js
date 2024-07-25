const smartsheet = require('smartsheet');

// Smartsheet Client Configuration
const smartsheetClient = smartsheet.createClient({ 
  accessToken: process.env.SMARTSHEET_ACCESS_TOKEN 
});

// Function to get and log sheet list
function logWorkspaceList() {
  smartsheetClient.workspaces.listWorkspaces()
    .then(function(workspaceList) {
      console.log('Workspaces in Smartsheet:', workspaceList);
    })
    .catch(function(error) {
      console.error('Error listing workspaces:', error.message);
    });
}

module.exports = { logWorkspaceList };