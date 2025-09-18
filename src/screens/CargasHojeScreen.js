import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const CargasHojeScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const { data, loading, lastUpdate, error, refresh } = useVehicleData("cargas_hoje");

  const fields = [
    { key: "destino", label: "Destino:" },
    { key: "produto", label: "Produto:" },
    { key: "peso_final", label: "Peso Final:" },
    { key: "motorista", label: "Motorista:" },
    {
      key: "horario_saida",
      label: "Horário Saída:",
      format: (value) => value ? formatDateTime(value) : "N/A"
    },
    {
      key: "data_conclusao",
      label: "Conclusão:",
      format: (value) => value ? formatDateTime(value, { includeTime: false }) : "N/A"
    },
  ];

  return (
    <VehicleListScreen
      navigation={navigation}
      title="Cargas de Hoje"
      subtitle={`Filial: ${state.selectedFilial}`}
      data={data}
      loading={loading}
      error={error}
      lastUpdate={lastUpdate}
      onRefresh={refresh}
      fields={fields}
      emptyMessage="Nenhuma carga realizada hoje"
      emptyIcon="✅"
    />
  );
};

export default CargasHojeScreen;