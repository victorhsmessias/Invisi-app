import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const DescargasHojeScreen = ({ navigation, route }) => {
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
  } = useVehicleData("descargas_hoje");

  const fields = [
    { key: "d_fila", label: "Fila:" },
    { key: "d_produto", label: "Produto:" },
    { key: "d_peso", label: "Peso (kg):" },
    {
      key: "d_data",
      label: "Data:",
      format: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : "N/A"
    },
    {
      key: "d_hora",
      label: "Hora:",
      format: (value) => value ? value.substring(0, 8) : "N/A"
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
      filtroServico={filtroServico}
      setFiltroServico={setFiltroServico}
      filtroOpPadrao={filtroOpPadrao}
      setFiltroOpPadrao={setFiltroOpPadrao}
      onApplyFilters={applyFiltersAndRefresh}
    />
  );
};

export default DescargasHojeScreen;