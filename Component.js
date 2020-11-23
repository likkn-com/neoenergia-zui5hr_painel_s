/*--------------------------------------------------------------------
*  Data......: 01/01/2017                                             *
*  Autor.....: Anderson Carmanhani (HCMX)							  *
*			   Beatriz Aparecida Calesco (HCMX)                       *
*			   Rodrigo de Brito Figueredo (HCMX)		              *
*---------------------------------------------------------------------*
*  Sobre a função:                                                    *
*  Projeto RH Responde Digital - Painel de Gestão					  *
*---------------------------------------------------------------------*
*  Alterações                                                         *
*  RESPONSÁVEL  						DESCRIÇÃO                     *
*--------------------------------------------------------------------*/
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"painelControle/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("painelControle.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.getRouter().initialize();
		}
	});
});