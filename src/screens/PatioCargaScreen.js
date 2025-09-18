import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const PatioCargaScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const { data, loading, lastUpdate, error, refresh } = useVehicleData("patio_carga");

  const fields = [
    { key: "destino", label: "Destino:" },
    { key: "produto", label: "Produto:" },
    { key: "peso_carregado", label: "Peso Carregado:" },
    { key: "motorista", label: "Motorista:" },
    {
      key: "inicio_carga",
      label: "Início Carga:",
      format: (value) => value ? formatDateTime(value) : "N/A"
    },
    { key: "box_carga", label: "Box:" },
    { key: "progresso", label: "Progresso:" },
  ];

  return (
    <VehicleListScreen
      navigation={navigation}
      title="Pátio de Carga"
      subtitle={`Filial: ${state.selectedFilial}`}
      data={data}
      loading={loading}
      error={error}
      lastUpdate={lastUpdate}
      onRefresh={refresh}
      fields={fields}
      emptyMessage="Nenhum veículo carregando"
      emptyIcon="🏗️"
    />
  );
};

export default PatioCargaScreen;