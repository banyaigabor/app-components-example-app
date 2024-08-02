const smartsheet = require('smartsheet');
const Asana = require('asana');

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

    console.log(`Found workspace: ${workspace.name}`);

    const workspaceDetails = await smartsheetClient.workspaces.getWorkspace({ id: workspace.id });
    const folder = workspaceDetails.folders.find(f => f.name === folderName);
    if (!folder) throw new Error('Folder not found');

    console.log(`Found folder: ${folder.name}`);

    const folderDetails = await smartsheetClient.folders.getFolder({ id: folder.id });
    const sheet = folderDetails.sheets.find(s => s.name === sheetName);
    if (!sheet) throw new Error('Sheet not found');

    console.log(`Found sheet: ${sheet.name}`);

    const sheetDetails = await smartsheetClient.sheets.getSheet({ id: sheet.id });
    const columns = sheetDetails.columns.reduce((map, col) => {
      map[col.title] = col.id;
      return map;
    }, {});

    console.log('Columns:', columns);

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

    console.log('Row:', row);

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

// Function to get custom field GID by name for a project
async function getCustomFieldGid(projectId, customFieldName) {
  let customFieldSettingsApiInstance = new Asana.CustomFieldSettingsApi();
  let opts = {
    'limit': 50,
    'opt_fields': "custom_field.name,custom_field.gid"
  };

  try {
    const result = await customFieldSettingsApiInstance.getCustomFieldSettingsForProject(projectId, opts);
    const customField = result.data.find(cf => cf.custom_field.name === customFieldName);
    if (!customField) throw new Error(`Custom field "${customFieldName}" not found`);
    return customField.custom_field.gid;
  } catch (error) {
    console.error('Error fetching custom field GID:', error.message);
    throw error;
  }
}

// Function to update a custom field for a task
async function updateCustomFieldForTask(taskId, customFieldGid, value) {
  let tasksApiInstance = new Asana.TasksApi();
  let opts = {
    'opt_fields': "custom_fields"
  };
  let body = {
    "data": {
      "custom_fields": {
        [customFieldGid]: value
      }
    }
  };

  try {
    const result = await tasksApiInstance.updateTask(taskId, body, opts);
    console.log('Custom field updated:', result.data);
  } catch (error) {
    console.error('Error updating custom field:', error.message);
    throw error;
  }
}

module.exports = { logWorkspaceList, submitDataToSheet, getRowsByTaskID, updateCustomFieldForTask, getCustomFieldGid };
