import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const PatioDescargaScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const { data, loading, lastUpdate, error, refresh } = useVehicleData("patio_descarga");

  const fields = [
    { key: "origem", label: "Origem:" },
    { key: "produto", label: "Produto:" },
    { key: "peso", label: "Peso:" },
    { key: "motorista", label: "Motorista:" },
    {
      key: "inicio_descarga",
      label: "Início Descarga:",
      format: (value) => value ? formatDateTime(value) : "N/A"
    },
    { key: "box_descarga", label: "Box:" },
    { key: "progresso", label: "Progresso:" },
  ];

  return (
    <VehicleListScreen
      navigation={navigation}
      title="Pátio de Descarga"
      subtitle={`Filial: ${state.selectedFilial}`}
      data={data}
      loading={loading}
      error={error}
      lastUpdate={lastUpdate}
      onRefresh={refresh}
      fields={fields}
      emptyMessage="Nenhum veículo descarregando"
      emptyIcon="📦"
    />
  );
};

export default PatioDescargaScreen;