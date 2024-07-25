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
async function submitDataToSheet(workspaceId, folderName, sheetName, submittedData) {
    try {
      // Get the workspace
      const workspaces = await smartsheetClient.workspaces.listWorkspaces();
      const workspace = workspaces.find(ws => ws.id === workspaceId);
      if (!workspace) throw new Error('Workspace not found');
  
      // Get the folder in the workspace
      const folders = await smartsheetClient.folders.listFolders({ workspaceId: workspace.id });
      const folder = folders.find(f => f.name === folderName);
      if (!folder) throw new Error('Folder not found');
  
      // Get the sheet in the folder
      const sheets = await smartsheetClient.sheets.listSheets({ folderId: folder.id });
      const sheet = sheets.find(s => s.name === sheetName);
      if (!sheet) throw new Error('Sheet not found');
  
      // Get the columns of the sheet
      const sheetDetails = await smartsheetClient.sheets.getSheet({ id: sheet.id });
      const columns = sheetDetails.columns.reduce((map, col) => {
        map[col.title] = col.id;
        return map;
      }, {});
  
      // Prepare the row data
      const row = {
        toBottom: true,
        cells: Object.keys(submittedData).map(key => ({
          columnId: columns[key],
          value: submittedData[key]
        }))
      };
  
      // Add the row to the sheet
      await smartsheetClient.sheets.addRows({ sheetId: sheet.id, body: [row] });
      console.log('Data submitted to Smartsheet');
    } catch (error) {
      console.error('Error submitting data to Smartsheet:', error.message);
    }
  }
  
  module.exports = { logWorkspaceList, submitDataToSheet };
module.exports = { logWorkspaceList };