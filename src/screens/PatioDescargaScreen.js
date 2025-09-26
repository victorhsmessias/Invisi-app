import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const PatioDescargaScreen = ({ navigation, route }) => {
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
  } = useVehicleData("patio_descarga");

  const fields = [
    { key: "pd_fila", label: "Fila:" },
    { key: "pd_produto", label: "Produto:" },
    { key: "pd_peso", label: "Peso (kg):" },
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
      filtroServico={filtroServico}
      setFiltroServico={setFiltroServico}
      filtroOpPadrao={filtroOpPadrao}
      setFiltroOpPadrao={setFiltroOpPadrao}
      onApplyFilters={applyFiltersAndRefresh}
    />
  );
};

export default PatioDescargaScreen;