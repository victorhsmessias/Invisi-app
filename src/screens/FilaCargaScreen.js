import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const FilaCargaScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const {
    data,
    loading,
    lastUpdate,
    error,
    refresh,
    filtroServico,
    setFiltroServico,
    filtroOpPadrao,
    setFiltroOpPadrao,
    applyFiltersAndRefresh
  } = useVehicleData("fila_carga");

  const fields = [
    { key: "fc_fila", label: "Fila:" },
    { key: "fc_produto", label: "Produto:" },
    { key: "fc_peso", label: "Peso (kg):" },
    {
      key: "fc_data",
      label: "Data:",
      format: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : "N/A"
    },
    {
      key: "fc_hora",
      label: "Hora:",
      format: (value) => value ? value.substring(0, 8) : "N/A"
    },
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
      filtroServico={filtroServico}
      setFiltroServico={setFiltroServico}
      filtroOpPadrao={filtroOpPadrao}
      setFiltroOpPadrao={setFiltroOpPadrao}
      onApplyFilters={applyFiltersAndRefresh}
    />
  );
};

export default FilaCargaScreen;