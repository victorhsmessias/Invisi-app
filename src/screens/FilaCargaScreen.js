import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const FilaCargaScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const { data, loading, lastUpdate, error, refresh } = useVehicleData("fila_carga");

  const fields = [
    { key: "destino", label: "Destino:" },
    { key: "produto", label: "Produto:" },
    { key: "peso_previsto", label: "Peso Previsto:" },
    { key: "motorista", label: "Motorista:" },
    {
      key: "data_agendamento",
      label: "Agendamento:",
      format: (value) => value ? formatDateTime(value) : "N/A"
    },
    { key: "posicao_fila", label: "Posição na Fila:" },
  ];

  return (
    <VehicleListScreen
      navigation={navigation}
      title="Fila de Carga"
      subtitle={`Filial: ${state.selectedFilial}`}
      data={data}
      loading={loading}
      error={error}
      lastUpdate={lastUpdate}
      onRefresh={refresh}
      fields={fields}
      emptyMessage="Nenhum veículo na fila de carga"
      emptyIcon="⏰"
    />
  );
};

export default FilaCargaScreen;