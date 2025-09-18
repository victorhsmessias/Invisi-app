import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const FilaDescargaScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const { data, loading, lastUpdate, error, refresh } = useVehicleData("fila_descarga");

  const fields = [
    { key: "origem", label: "Origem:" },
    { key: "produto", label: "Produto:" },
    { key: "peso", label: "Peso:" },
    { key: "motorista", label: "Motorista:" },
    {
      key: "data_chegada",
      label: "Chegada:",
      format: (value) => value ? formatDateTime(value) : "N/A"
    },
    { key: "posicao_fila", label: "Posição na Fila:" },
  ];

  return (
    <VehicleListScreen
      navigation={navigation}
      title="Fila de Descarga"
      subtitle={`Filial: ${state.selectedFilial}`}
      data={data}
      loading={loading}
      error={error}
      lastUpdate={lastUpdate}
      onRefresh={refresh}
      fields={fields}
      emptyMessage="Nenhum veículo na fila de descarga"
      emptyIcon="⏳"
    />
  );
};

export default FilaDescargaScreen;