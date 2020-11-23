sap.ui.define(function() {
	"use strict";
	var Formatter = {

		status: function(type) {
			switch (type) {
				case 'C':
					return "Cancelada";
				case 'P':
					return "Em Andamento";
				case 'R':
					return "Salva";
				case 'F':
					return "Finalizada";
				case 'X':
					return "Saneada";

				case '':
					return "";
			}
			return type;
		},

		tipo_req: function(type) {
			switch (type) {
				case '100':
					return "Manutenção Cadastral";
				case '200':
					return "Alteração funcional";
				case '300':
					return "Manutenção estrutura organizacional";
				case '000':
					return "";
				case '':
					return "";
			}
			return type;
		},

		subtipo_req: function(type) {
			switch (type) {
				case '101':
					return "Dados bancários";
				case '102':
					return "Dados pessoais";
				case '103':
					return "Dependentes";
				case '104':
					return "Documentos";
				case '105':
					return "Endereços e telefones";
				case '106':
					return "Formação educacional";
				case '107':
					return "Ausências";
				case '108':
					return "Sindicatos";
				case '109':
					return "Benefícios";
				case '110':
					return "Deficiência";
				case '111':
					return "Aposentadoria";
				case '112':
					return "Estabilidade";
				case '113':
					return "Vale transporte";
				case '114':
					return "Plano Saúde/Odonto Titular";
				case '115':
					return "Seguro de Vida";
				case '116':
					return "Vale Refeição";
				case '117':
					return "Auxílio Aluguel";
				case '118':
					return "Associação Esportiva";
				case '119':
					return "Transporte Fretado";
				case '120':
					return "Cooperativa";
				case '':
					return "";
			}
			return type;
		},

		nomeMovimentado: function(type, nome) {
			if (type == '1')
				return '';
			return nome;
		},

		date: function(sDate) {
			jQuery.sap.require("sap.ui.core.format.DateFormat");
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy"
			});
			var oDate = new Date(sDate);

			return oDateFormat.format(oDate);
		},

		checkbox: function(sVal) {
			if (sVal == 'x' || sVal == 'X')
				return true;
			return false;
		},

		floatFormat: function(sVal) {
			jQuery.sap.require("sap.ui.core.format.NumberFormat");

			var val = parseFloat(sVal).toFixed(2);

			var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ".",
				decimalSeparator: ","
			});

			return oNumberFormat.format(val);

		},

		time: function(sTime) {

			if (sTime != 'PT00H00M00S' && sTime != null) {
				return sTime.match(/(\d{2})H(\d{2})M(\d{2})S$/).slice(-3).join(":");
			} else {
				return '';
			}

		},

	};

	return Formatter;

}, /* bExport= */ true);