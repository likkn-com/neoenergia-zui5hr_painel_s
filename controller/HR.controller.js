sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../formatter/Formatter",
	"sap/m/MessageBox",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/core/util/Export",
	'sap/ui/core/Fragment',
	'sap/ui/model/Filter',
	"sap/ui/model/json/JSONModel",
], function (Controller, Formatter, MessageBox, ExportCSV, Export, Fragment, Filter, JSONModel) {
	"use strict";
    // HR Controller...
	return Controller.extend("painelControle.controller.HR", {

		onInit: function (oEvent) {

			var that = this;

			this.oInitialLoadFinishedDeferred = jQuery.Deferred();

			this.fSearchHelps();

		},

		//	--------------------------------------------
		//	_handleValueHelpSearch 
		//	--------------------------------------------
		_handleValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");

			var oFilter = new Filter(
				oEvent.getSource().data("description"),
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		//	--------------------------------------------
		//	_handleValueHelpClose 
		//	--------------------------------------------
		_handleValueHelpClose: function (oEvent) {

			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.getView().byId(this.inputId);

				if (oEvent.getSource().data("getParam") != null) {
					if (oEvent.getSource().data("getParam") == "Title") {
						productInput.setValue(oSelectedItem.getTitle());
					} else if (oEvent.getSource().data("getParam") == "Description") {
						productInput.setValue(oSelectedItem.getDescription());
					}
				} else {
					productInput.setValue(oSelectedItem.getTitle());
				}

			}
			oEvent.getSource().getBinding("items").filter([]);

			if (oEvent.getSource().data("lblText") != null) {
				this.getView().byId(oEvent.getSource().data("lblText")).setText(oSelectedItem.getDescription());
			}

			if (oEvent.getSource().data("input") != null) {
				this.getView().byId(oEvent.getSource().data("input")).fireChange();
			}

		},

		//	--------------------------------------------
		//	handleValueHelp 
		//	--------------------------------------------		
		handleValueHelp: function (oEvent) {

			var sInputValue = oEvent.getSource().getValue();

			this.inputId = oEvent.getSource().getId();

			// create value help dialog
			this._valueHelpDialog = sap.ui.xmlfragment(
				oEvent.getSource().data("fragment"),
				this
			);
			this.getView().addDependent(this._valueHelpDialog);

			// open value help dialog
			this._valueHelpDialog.open(sInputValue);
		},

		// --------------------------------------------
		// onReqNumberChange
		// -------------------------------------------- 		
		onReqNumberChange: function (oEvent) {
			var value = oEvent.getParameter("newValue");

			//Complete string with zeros on the left (if it's filled)
			if (value.trim() !== "") {
				this.getView().byId("inRequisitionNumber").setValue(value.padStart(8, 0));
			}
		},

		// --------------------------------------------
		// onSearch
		// -------------------------------------------- 		
		onProcessSearch: function () {

			var that = this;
			var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/SAP/ZODHR_SS_RESP_DIGITAL_SRV/");

			function fSuccess(oEvent) {

				var oValue = new sap.ui.model.json.JSONModel(oEvent.results[0].COCKPIT.results);
				var oTable = that.getView().byId("tRequisition");
				oTable.setModel(oValue);
				oTable.bindRows("/");
				that.getView().setModel(oValue, "ET_COCKPIT");

				//If there is at least one record, enable export to excel
				if (oValue.getData().length > 0) {
					that.getView().byId("btnExportExcel").setEnabled(true);
				} else {
					that.getView().byId("btnExportExcel").setEnabled(false);
				}

				if (!!sap.ui.Device.browser.webkit && !document.width) {
					jQuery.sap.require("sap.ui.core.ScrollBar");

					var fnOrg = sap.ui.core.ScrollBar.prototype.onAfterRendering;

					sap.ui.core.ScrollBar.prototype.onAfterRendering = function () {
						document.width = window.outerWidth;
						fnOrg.apply(this, arguments);
						document.width = undefined;
					};
				}
			}

			function fError(oEvent) {
				var message = $(oEvent.response.body).find('message').first().text();

				if (message.substring(2, 4) == "99") {
					var detail = ($(":contains(" + "/IWBEP/CX_SD_GEN_DPC_BUSINS" + ")", oEvent.response.body));
					var formattedDetail = detail[2].outerText.replace("/IWBEP/CX_SD_GEN_DPC_BUSINS", "");
					var zMessage = formattedDetail.replace("error", "");

					MessageBox.error(zMessage);

				} else {
					MessageBox.error(message);
				}
			}

			// var REQUISITION_TYPE = that.getView().byId("slProcessType").getProperty('selectedKey');
			var REQUISITION_TYPE = '100';
			var REQUISITION_SUBTYPE = that.getView().byId("slProcessSubType").getProperty('selectedKey');
			var REQUISITION_ID = that.getView().byId("inRequisitionNumber").getValue();
			var ARH = that.getView().byId("inARH").getValue();
			// var ORG = that.getView().byId("inOrg").getValue();
			var ORG = "";
			var BEGDA = that.getView().byId("inBegda").getValue();
			var ENDDA = that.getView().byId("inEndda").getValue();

			var STATUS;
			if (that.getView().byId("rbInProgress").getProperty('selected')) {
				STATUS = 'P';
			} else if (that.getView().byId("rbFinished").getProperty('selected')) {
				STATUS = 'F';
			} else if (that.getView().byId("rbCanceled").getProperty('selected')) {
				STATUS = 'C';
			} else if (that.getView().byId("rbAll").getProperty('selected')) {
				STATUS = '';
			}

			//Solicitado Por
			// var ARH_SOLICITADO = that.getView().byId("ipAreaRequester").getValue();
			var PERNR_SOLICITADO = that.getView().byId("ipPersonalNumberReq").getValue();
			//Parado Em
			// var ARH_PARADO = that.getView().byId("ipAreaStoppedIn").getValue();
			// var PERNR_PARADO = that.getView().byId("ipPersonalNumberStoppedIn").getValue();
			//Aprovador por
			var PERNR_APROVADO = that.getView().byId("ipPersonalNumberApproved").getValue();

			//MAIN READ
			var urlParam = this.fFillURLParamFilter("REQUISITION_TYPE", REQUISITION_TYPE);
			urlParam = this.fFillURLParamFilter("REQUISITION_SUBTYPE", REQUISITION_SUBTYPE, urlParam);
			urlParam = this.fFillURLParamFilter("STATUS", STATUS, urlParam);
			urlParam = this.fFillURLParamFilter("REQUISITION_ID", REQUISITION_ID, urlParam);
			urlParam = this.fFillURLParamFilter("WERKS", ARH, urlParam);
			urlParam = this.fFillURLParamFilter("ORGEH", ORG, urlParam);

			var oStartupParameters = jQuery.sap.getUriParameters().mParams;
			if (oStartupParameters.IM_PROFILE) {

				if (oStartupParameters.IM_PROFILE[0] == "RH") {
					urlParam = this.fFillURLParamFilter("LOGGED_IN", 6, urlParam);
				}
				if (oStartupParameters.IM_PROFILE[0] == "SSG") {
					urlParam = this.fFillURLParamFilter("LOGGED_IN", 5, urlParam);
				}
				if (oStartupParameters.IM_PROFILE[0] == "COE") {
					urlParam = this.fFillURLParamFilter("LOGGED_IN", 3, urlParam);
				}
			}

			if (BEGDA) {
				urlParam = this.fFillURLParamFilter("BEGDA", BEGDA, urlParam, true);
			}
			if (ENDDA) {
				urlParam = this.fFillURLParamFilter("ENDDA", ENDDA, urlParam, true);
			}

			// urlParam = this.fFillURLParamFilter("REQUESTER_AREA", ARH_SOLICITADO, urlParam);
			urlParam = this.fFillURLParamFilter("REQUESTER_PERNR", PERNR_SOLICITADO, urlParam);
			// urlParam = this.fFillURLParamFilter("STOPPED_AREA", ARH_PARADO, urlParam);
			// urlParam = this.fFillURLParamFilter("STOPPED_PERNR", PERNR_PARADO, urlParam);
			urlParam = this.fFillURLParamFilter("APPROVED_PERNR", PERNR_APROVADO, urlParam);

			urlParam = urlParam + "&$expand=COCKPIT";

			oModel.read("ET_COCKPIT", null, urlParam, false, fSuccess, fError);

		},

		//	--------------------------------------------
		//	fSearchHelps
		//	--------------------------------------------		
		fSearchHelps: function () {
			var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/SAP/ZODHR_SS_SEARCH_HELP_SRV_01/");

			this.fSetSearchHelpValue(oModel, "ET_SH_UO");
			this.fSetSearchHelpValue(oModel, "ET_SH_ARH");
			// this.fSetSearchHelpValue(oModel, "ET_SH_EMPLOYEE");
		},

		//--------------------------------------------
		//	onHelpRequestEmployee
		//--------------------------------------------		
		onHelpRequestEmployee: function (oEvent) {
			var cols = [{
				label: "Código",
				template: "PERSNO"
			}, {
				label: "Descrição",
				template: "CNAME"
			}];

			this.fHelpRequest("", "CNAME", cols, "ET_SH_EMPLOYEE", this, "Colaborador",
				oEvent.getParameter("id").substring(12), 'txt' + oEvent.getParameter("id").substring(12), true, false);
		},

		//--------------------------------------------
		//	onHelpRequestARH
		//--------------------------------------------		
		onHelpRequestARH: function (oEvent) {
			var cols = [{
				label: "Código",
				template: "Werks"
			}, {
				label: "Descrição",
				template: "Name1"
			}];

			this.fHelpRequest("", "Werks", cols, "ET_SH_ARH", this, "Área de RH",
				oEvent.getParameter("id").substring(12), 'txt' + oEvent.getParameter("id").substring(12), true, false);
		},

		//--------------------------------------------
		//	onHelpRequestUO
		//--------------------------------------------		
		onHelpRequestUO: function (oEvent) {
			var cols = [{
				label: "Código",
				template: "ORGEH"
			}, {
				label: "Descrição",
				template: "ORGTX"
			}];

			this.fHelpRequest("", "ORGEH", cols, "ET_SH_UO", this, "Unidade Organizacional",
				oEvent.getParameter("id").substring(12), oEvent.getParameter("id").substring(12), true, false);
		},

		//--------------------------------------------
		//	fHelpRequest
		//--------------------------------------------		
		fHelpRequest: function (key, descriptionKey, cols, modelName, that, title, screenKeyField, screenTextField, onlyDesc, onlyKey) {
			var oScreenKeyField = that.getView().byId(screenKeyField);
			var oScreenTextField = that.getView().byId(screenTextField);

			that._oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				supportRanges: false,
				supportRangesOnly: false,
				supportMultiselect: false,
				key: key,
				descriptionKey: descriptionKey,

				ok: function (oEvent) {
					var aTokens = oEvent.getParameter("tokens");

					//Set values into others corresponding fiels in screen
					if (onlyDesc === false) {
						oScreenKeyField.setValue(aTokens[0].getProperty("key"));
						oScreenTextField.setText(aTokens[0].getProperty("text"));
					} else {
						if (onlyKey === true) {
							oScreenKeyField.setValue(aTokens[0].getProperty("key"));
						} else {
							oScreenKeyField.setValue(aTokens[0].getProperty("text"));
						}
					}

					this.close();
				},
				cancel: function () {
					this.close();
				}
			});

			//Set columns to the Search Help creation 
			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols: cols
			});

			//Clear any messages it may have
			this.fMessage("None", null, screenKeyField);

			//Create the Search Help columns structure
			var oTable = this._oValueHelpDialog.getTable();
			oTable.setModel(oColModel, "columns");

			//Create contens (on test purpose) and bind it to the Search Help 
			var oModel = this.getView().getModel(modelName);
			oTable.setModel(oModel);
			oTable.bindRows("/");

			//Set title and open dialog
			that._oValueHelpDialog.setTitle(title);
			this._oValueHelpDialog.open();
		},
		//	--------------------------------------------
		//	fSetSearchHelpValue
		//	--------------------------------------------		
		fSetSearchHelpValue: function (oModel, modelName, urlParam) {
			var that = this;

			function fSuccessExecutar(oEvent) {
				var oValue = new sap.ui.model.json.JSONModel(oEvent.results);
				that.getView().setModel(oValue, modelName);
			}

			function fErrorExecutar(oEvent) {
				console.log("An error occured while reading" + modelName + "!");
			}

			if (urlParam !== null & urlParam !== "" & urlParam !== undefined) {
				oModel.read(modelName, null, urlParam, false, fSuccessExecutar, fErrorExecutar);
			} else {
				oModel.read(modelName, null, null, false, fSuccessExecutar, fErrorExecutar);
			}
		},

		//	--------------------------------------------
		//	fGetUrl
		//	--------------------------------------------		
		fGetUrl: function (imPernr, imRequisitionId, imLoggedIn) {
			var urlParam;

			// $filter=REQUISITION_TYPE eq '100' and REQUISITION_SUBTYPE eq '103' and STATUS eq 'C' and WERKS eq 'BRAA' &$expand=COCKPIT

			urlParam = this.fFillURLParam("REQUISITION_TYPE", imPernr);
			urlParam = this.fFillURLParam("REQUISITION_SUBTYPE", imRequisitionId, urlParam);
			urlParam = this.fFillURLParam("STATUS", imLoggedIn, urlParam, true);

			return urlParam;
		},

		//	--------------------------------------------
		//	fFillURLParamFilter
		//	--------------------------------------------		
		fFillURLParamFilter: function (p_atrib, p_valor, p_param, p_date) {
			//monta URL de parametros para o Gateway (filter)
			if (p_param === "" || typeof p_param === "undefined") {
				p_param = "$filter=";
			} else {
				p_param = p_param + " and ";
			}

			if (p_date == true) {
				p_param = p_param + p_atrib + " eq datetime'" + p_valor + "'";
			} else {
				p_param = p_param + p_atrib + " eq '" + p_valor + "'";
			}

			return p_param;
		},

		//	--------------------------------------------
		//	fReadModelFillDesc
		//	--------------------------------------------		
		fReadModelFillDesc: function (mockSubname, field, fieldCompletePersNum, fieldCompleteName) {
			//Get Model
			//var oModelSH = sap.ui.getCore().getModel("MDL_SH");
			var oModelSH = this.getView().getModel("ET_SH_EMPLOYEE");

			//Get values from view
			var oDataSH = oModelSH.getData();
			var fieldValue = this.getView().byId(field);
			var fieldPersNum = this.getView().byId(fieldCompletePersNum);
			var fieldName = this.getView().byId(fieldCompleteName);
			var valueExists = false;

			fieldPersNum.setValue("");
			fieldName.setValue("");

			//Verify if the inputed field value is valid
			for (var i = 0; i < oDataSH[mockSubname].length; i++) {
				if (fieldValue.getValue() === oDataSH[mockSubname][i]["User"]) {
					valueExists = true;
					break;
				}
			}

			//If so, fill the description with the corresponding value besides the key field. 
			//If not, clear description and indicates error to user
			if (valueExists === true) {
				fieldPersNum.setValue(oDataSH[mockSubname][i]["PersNum"]); //+ " (" + oDataSH[mockSubname][i][keyColumnKey] + ")");
				fieldName.setValue(oDataSH[mockSubname][i]["Name"]);

				this.fMessage("None", null, field);
			} else {

				if (fieldValue.getProperty("valueState") !== "Error") {
					this.fMessage("Error", "entrada_invalida", field);
				} else {
					if (fieldValue.getValue() === "" || fieldValue.getValue() === undefined) {
						this.fMessage("None", null, field);
					}
				}
			}
		},

		//	--------------------------------------------
		//	fFillNameFromNumber
		//	--------------------------------------------		
		fFillNameFromNumber: function (field, fieldCompleteName) {

			var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/SAP/ZODHR_SS_SEARCH_HELP_SRV_01/");
			var fieldValue = this.getView().byId(field).getValue();
			var fieldName = this.getView().byId(fieldCompleteName);

			function fSuccess(oEvent) {
				fieldName.setValue(oEvent.EX_CNAME);
			}

			function fError(oEvent) {
				fieldName.setValue("");
			}

			var urlParam = "(IM_PERNR='" + fieldValue + "')";

			oModel.read("ET_GET_NAME" + urlParam, null, null, false, fSuccess, fError);

		},

		//	--------------------------------------------
		//	onPressExportExcel
		//	--------------------------------------------
		onPressExportExcel: function () {

			this.fExportExcel("tRequisition", "Requisições");
		},

		//--------------------------------------------
		//	fExportExcel
		//--------------------------------------------			
		fExportExcel: function (tableName, fileName) {
			var aColumnsCSV = [];
			var label;
			var text;

			//Structure of the file
			var exportFile = new sap.ui.core.util.ExportTypeCSV({
				separatorChar: ";"
			});

			//Read table's columns
			var oTable = this.getView().byId(tableName);
			var aColumns = oTable.getColumns();

			//Read the content from Model
			var aColumnData = oTable.getModel();

			//Bind the Columns with column name and column content (BINDING)
			for (var i = 0; i < aColumns.length; i++) {
				if (aColumns[i].getVisible() === false) {
					continue;
				}

				aColumnsCSV[i] = {};

				//Get columns description
				label = aColumns[i].getLabel();
				text = label.getText();

				//Column content (BINDING)
				aColumnsCSV[i].name = text;

				if (aColumns[i].getName() == "BASE_DATE" ||
					aColumns[i].getName() == "APPROVER_1_DATE" ||
					aColumns[i].getName() == "APPROVER_2_DATE" ||
					aColumns[i].getName() == "APPROVER_3_DATE" ||
					aColumns[i].getName() == "APPROVER_4_DATE" ||
					aColumns[i].getName() == "EFFECTIVE_DATE" ||
					aColumns[i].getName() == "DISAPPROVED_DATE") {
					aColumnsCSV[i].template = {
						content: "{ path: '" + aColumns[i].getName() +
							"', type: 'sap.ui.model.type.Date', formatOptions: { source: { pattern: 'yyyy-MM-ddTHH:mm:ss.sssssss' }, pattern: 'dd/MM/yyyy' } }"
					};
				} else if (
					aColumns[i].getName() == "APPROVER_1_TIME" ||
					aColumns[i].getName() == "APPROVER_2_TIME" ||
					aColumns[i].getName() == "APPROVER_3_TIME" ||
					aColumns[i].getName() == "APPROVER_4_TIME" ||
					aColumns[i].getName() == "DISAPPROVED_TIME") {
					aColumnsCSV[i].template = {
						content: "{ path: '" + aColumns[i].getName() +
							"', formatter:'painelControle.resources.Formatter.time'}"
					};

				} else if (aColumns[i].getName() == "REQUISITION_TYPE") {
					aColumnsCSV[i].template = {
						content: "{ path:'REQUISITION_TYPE', formatter:'painelControle.resources.Formatter.tipo_req'}"
					};

				} else if (aColumns[i].getName() == "REQUISITION_SUBTYPE") {
					aColumnsCSV[i].template = {
						content: "{path:'REQUISITION_SUBTYPE', formatter:'painelControle.resources.Formatter.subtipo_req'}"
					};
				} else if (aColumns[i].getName() == "STATUS") {
					aColumnsCSV[i].template = {
						content: "{path:'STATUS', formatter:'painelControle.resources.Formatter.status'}"
					};
				} else {

					aColumnsCSV[i].template = {
						content: "{" + aColumns[i].getName() + "}"
					};
				}
			}

			//Create the Excel object with the definitions
			var oExport = new sap.ui.core.util.Export({
				exportType: exportFile,
				models: aColumnData,
				rows: {
					path: "/"
				},
				columns: aColumnsCSV
			});

			//Export file 
			oExport.saveFile(fileName).always(function () {
				this.destroy();
			});
		},

		//	--------------------------------------------
		//	fVerifyError
		//	--------------------------------------------		
		fVerifyError: function (field) {
			var fieldValue = this.getView().byId(field);

			if (fieldValue.getProperty("valueState") !== "Error") {
				return false;
			} else {
				return true;
			}
		},

		//--------------------------------------------
		//	fFillHeaderSpan
		//--------------------------------------------
		fFillHeaderSpan: function (idCol, quantityColBelow) {
			var oView = this.getView();

			oView.byId(idCol).setHeaderSpan([quantityColBelow, "1"]);
		},

		//--------------------------------------------
		//	fColumnsLayout
		//--------------------------------------------	
		fColumnsLayout: function () {
			//Process data
			this.fFillHeaderSpan("EW_REQ_NUM", "8");
			this.fFillHeaderSpan("EW_SOL_DATE", "8");
			this.fFillHeaderSpan("EW_SOL_TIME", "8");
			this.fFillHeaderSpan("EW_TITLE", "8");
			this.fFillHeaderSpan("EW_EMPLOYEE_NAME", "8");
			this.fFillHeaderSpan("EW_COMPANY", "8");
			this.fFillHeaderSpan("EW_EFFECT_DATE", "8");
			this.fFillHeaderSpan("EW_EFFECT_TIME", "8");

			//Requester
			this.fFillHeaderSpan("EW_REQUESTER_USR", "3");
			this.fFillHeaderSpan("EW_REQUESTER_PERSNUMBER", "3");
			this.fFillHeaderSpan("EW_REQUESTER_NAME", "3");

			//Stopped in 
			this.fFillHeaderSpan("EW_STOPPED_IN_USR", "3");
			this.fFillHeaderSpan("EW_STOPPED_IN_PERSNUMBER", "3");
			this.fFillHeaderSpan("EW_STOPPED_IN_NAME", "3");
		},

		//	--------------------------------------------
		//	fMessage
		//	--------------------------------------------
		fMessage: function (type, msg, field) {
			//Get message text from i18n
			console.log("load i18n");

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var message = oBundle.getText(msg);

			//Message text
			this.getView().byId(field).setValueStateText(message);

			//Set message in the field with the type and text
			this.getView().byId(field).setValueState(sap.ui.core.ValueState[type]);
		},

		//--------------------------------------------
		//	onChangePeriod
		//--------------------------------------------				
		onChangePeriod: function (oEvent) {
			var valid = oEvent.getParameter("valid");

			if (valid === false) {
				this.fMessage("Error", "entrada_invalida", "drsPeriod");
				return false;
			} else {
				this.fMessage("None", null, "drsPeriod");
				return true;
			}
		},

		//--------------------------------------------
		//	onHelpfuestUsrPortalRequester
		//--------------------------------------------		
		onHelpRequestUsrPortalRequester: function () {
			var cols = [{
				label: "Usuário",
				template: "User"
			}, {
				label: "Nome",
				template: "Name"
			}];

			this.fHelpRequest("miUsrSapPortalReq", "User", "Name", cols, "RequesterUsr", "Usuário", "ipPersonalNumberReq", "ipNameReq");
		},

		//--------------------------------------------
		//	onHelpRequestUsrPortalStoppedIn
		//--------------------------------------------		
		onHelpRequestUsrPortalStoppedIn: function () {
			var cols = [{
				label: "Usuário",
				template: "User"
			}, {
				label: "Nome",
				template: "Name"
			}];

			this.fHelpRequest("miUsrSapPortalStoppedIn", "User", "Name", cols, "StoppedInUser", "Usuário", "ipPersonalNumberStoppedIn",
				"ipNameStoppedIn");
		},

		//--------------------------------------------
		//	onProcessSearch
		//--------------------------------------------		
		// onProcessSearch: function() {

		// 	var oTable = this.getView().byId("tRequisition");
		// 	var oRowModel = new sap.ui.model.json.JSONModel("model/mockRequisitionTableHR.json");

		// 	if (this.fVerifyError("miUsrSapPortalReq") === false & this.fVerifyError("miUsrSapPortalStoppedIn") === false) {
		// 		//Insert the Busy Indicator
		// 		var oPage = this.getView().byId("pageHR");
		// 		oPage.setBusy(true);

		// 		//Selection of values entered by the user in the selection screen
		// 		var slSelectedProcessType = this.getView().byId("slProcessType").getSelectedKey();
		// 		var mockPath = "";

		// 		switch (slSelectedProcessType) {
		// 			case "1":
		// 				mockPath = "/RHProcessAll";
		// 				break;
		// 			case "2":
		// 				mockPath = "/RHProcessSalaryAmendment";
		// 				break;
		// 			case "3":
		// 				mockPath = "/RHProcessFunctionalChange";
		// 				break;
		// 			case "4":
		// 				mockPath = "/RHProcessCadastralMaintenance";
		// 				break;

		// 			case "5":
		// 				mockPath = "/RHProcessOrgStructure";
		// 				break;
		// 		}

		// 		//Create contens (on test purpose) and bind it to table
		// 		oTable.setModel(oRowModel);
		// 		oTable.bindRows(mockPath);

		// 		//Remove the Busy Indicator
		// 		oPage.setBusy(false);
		// 	} else {
		// 		//Clear table content
		// 		var oNullModel = new sap.ui.model.json.JSONModel();
		// 		oTable.setModel(oNullModel);
		// 	}

		// },

		//	--------------------------------------------
		//	onChangeRequester
		//	--------------------------------------------		
		onChangeRequester: function (oEvent) {

			var value = oEvent.getParameter("newValue");

			//Complete string with zeros on the left (if it's filled)
			if (value.trim() !== "") {
				this.getView().byId("ipPersonalNumberReq").setValue(value.padStart(8, 0));
			}

			this.fFillNameFromNumber("ipPersonalNumberReq", "txtPersonalNumberReq");

		},

		//	--------------------------------------------
		//	onChangeStoppedIn
		//	--------------------------------------------		
		onChangeStoppedIn: function (oEvent) {
			var value = oEvent.getParameter("newValue");

			//Complete string with zeros on the left (if it's filled)
			if (value.trim() !== "") {
				this.getView().byId("ipPersonalNumberStoppedIn").setValue(value.padStart(8, 0));
			}
			this.fFillNameFromNumber("ipPersonalNumberStoppedIn", "txtPersonalNumberStoppedIn");
		},

		onChangeApproved: function (oEvent) {
			var value = oEvent.getParameter("newValue");

			//Complete string with zeros on the left (if it's filled)
			if (value.trim() !== "") {
				this.getView().byId("ipPersonalNumberApproved").setValue(value.padStart(8, 0));
			}
			this.fFillNameFromNumber("ipPersonalNumberApproved", "txtipPersonalNumberApproved");
		}

	});
});