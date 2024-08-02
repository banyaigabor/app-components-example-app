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

// Mapping of submittedData keys to Smartsheet column names
const columnMapping = {
  ProjectNumber_SL: 'Projektszám',
  ProjectName_SL: 'Projektnév',
  AsanaTaskName_SL: 'ASANA TaskName',
  Worker_dropdown: 'Munkavégző',
  date: 'Munkavégzés Dátuma',
  Distance_SL: 'Kilométer',
  radio_button: 'Szerepkör',
  PlateNumber_dropdown: 'Rendszám',
  AsanaTaskID_SL: 'ASANA TaskID'
};

// Function to get sheet columns and submit data to Smartsheet
async function submitDataToSheet(workspaceId, folderName, sheetName, submittedData) {
  try {
    const workspacesResponse = await smartsheetClient.workspaces.listWorkspaces();
    const workspace = workspacesResponse.data.find(ws => ws.id == workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    const workspaceDetails = await smartsheetClient.workspaces.getWorkspace({ id: workspace.id });
    const folder = workspaceDetails.folders.find(f => f.name === folderName);
    if (!folder) throw new Error('Folder not found');

    const folderDetails = await smartsheetClient.folders.getFolder({ id: folder.id });
    const sheet = folderDetails.sheets.find(s => s.name === sheetName);
    if (!sheet) throw new Error('Sheet not found');

    const sheetDetails = await smartsheetClient.sheets.getSheet({ id: sheet.id });
    const columns = sheetDetails.columns.reduce((map, col) => {
      map[col.title] = col.id;
      return map;
    }, {});

    const row = {
      toBottom: true,
      cells: Object.keys(submittedData).map(key => {
        const columnName = columnMapping[key];
        const columnId = columns[columnName];
        if (!columnId) {
          throw new Error(`Column ID for key ${key} not found`);
        }
        return {
          columnId: columnId,
          value: submittedData[key]
        };
      })
    };

    await smartsheetClient.sheets.addRows({ sheetId: sheet.id, body: [row] });
    console.log('Data submitted to Smartsheet');
  } catch (error) {
    console.error('Error submitting data to Smartsheet:', error.message);
  }
}

// Function to get rows from a sheet by Task ID
async function getRowsByTaskID(workspaceId, folderName, sheetName, taskId) {
  try {
    const workspacesResponse = await smartsheetClient.workspaces.listWorkspaces();
    const workspace = workspacesResponse.data.find(ws => ws.id == workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    const workspaceDetails = await smartsheetClient.workspaces.getWorkspace({ id: workspace.id });
    const folder = workspaceDetails.folders.find(f => f.name === folderName);
    if (!folder) throw new Error('Folder not found');

    const folderDetails = await smartsheetClient.folders.getFolder({ id: folder.id });
    const sheet = folderDetails.sheets.find(s => s.name === sheetName);
    if (!sheet) throw new Error('Sheet not found');

    const sheetDetails = await smartsheetClient.sheets.getSheet({ id: sheet.id });

    const taskIdColumn = sheetDetails.columns.find(col => col.title === 'ASANA TaskID');
    if (!taskIdColumn) throw new Error('ASANA TaskID column not found');

    const kilometerColumn = sheetDetails.columns.find(col => col.title === 'Kilométer');
    if (!kilometerColumn) throw new Error('Kilométer column not found');

    const filteredRows = sheetDetails.rows.filter(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
      return taskIdCell && taskIdCell.value === taskId;
    });

    const totalKilometers = filteredRows.reduce((total, row) => {
      const kilometerCell = row.cells.find(cell => cell.columnId === kilometerColumn.id);
      return total + (kilometerCell ? parseFloat(kilometerCell.value) || 0 : 0);
    }, 0);

    return { filteredRows, totalKilometers };
  } catch (error) {
    console.error('Error fetching rows from Smartsheet:', error.message);
    throw error;
  }
}

module.exports = { logWorkspaceList, submitDataToSheet, getRowsByTaskID };
