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

// Function to get sheet columns and submit data to Smartsheet
async function submitDataToSheet(workspaceId, folderName, sheetName, submittedData) {
  try {
    // Get the workspace
    const workspacesResponse = await smartsheetClient.workspaces.listWorkspaces();
    const workspace = workspacesResponse.data.find(ws => ws.id == workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    console.log(`Found workspace: ${workspace.name}`);

    // Get the folder in the workspace
    const foldersResponse = await smartsheetClient.folders.listFolders({ workspaceId: workspace.id });
    const folder = foldersResponse.data.find(f => f.name === folderName);
    if (!folder) throw new Error('Folder not found');

    console.log(`Found folder: ${folder.name}`);

    // Get the sheet in the folder
    const sheetsResponse = await smartsheetClient.sheets.listSheets({ folderId: folder.id });
    const sheet = sheetsResponse.data.find(s => s.name === sheetName);
    if (!sheet) throw new Error('Sheet not found');

    console.log(`Found sheet: ${sheet.name}`);

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
