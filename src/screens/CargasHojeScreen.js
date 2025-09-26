import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const CargasHojeScreen = ({ navigation, route }) => {
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
  } = useVehicleData("cargas_hoje");

  const fields = [
    { key: "c_fila", label: "Fila:" },
    { key: "c_produto", label: "Produto:" },
    { key: "c_peso", label: "Peso (kg):" },
    {
      key: "c_data",
      label: "Data:",
      format: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : "N/A"
    },
    {
      key: "c_hora",
      label: "Hora:",
      format: (value) => value ? value.substring(0, 8) : "N/A"
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
      filtroServico={filtroServico}
      setFiltroServico={setFiltroServico}
      filtroOpPadrao={filtroOpPadrao}
      setFiltroOpPadrao={setFiltroOpPadrao}
      onApplyFilters={applyFiltersAndRefresh}
    />
  );
};

export default CargasHojeScreen;