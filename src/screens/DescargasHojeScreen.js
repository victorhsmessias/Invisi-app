import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const DescargasHojeScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const { data, loading, lastUpdate, error, refresh } = useVehicleData("descargas_hoje");

  const fields = [
    { key: "origem", label: "Origem:" },
    { key: "produto", label: "Produto:" },
    { key: "peso_final", label: "Peso Final:" },
    { key: "motorista", label: "Motorista:" },
    {
      key: "horario_chegada",
      label: "Horário Chegada:",
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
      title="Descargas de Hoje"
      subtitle={`Filial: ${state.selectedFilial}`}
      data={data}
      loading={loading}
      error={error}
      lastUpdate={lastUpdate}
      onRefresh={refresh}
      fields={fields}
      emptyMessage="Nenhuma descarga realizada hoje"
      emptyIcon="✅"
    />
  );
};

export default DescargasHojeScreen;