import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const TransitoScreen = ({ navigation, route }) => {
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
  } = useVehicleData("transito");

  React.useEffect(() => {
    if (data && data.length > 0) {
      console.log("[TransitoScreen] Data sample:", data[0]);
      console.log("[TransitoScreen] All keys:", Object.keys(data[0] || {}));
    }
  }, [data]);

  const fields = [
    { key: "t_fila", label: "Fila:" },
    { key: "t_produto", label: "Produto:" },
    { key: "t_peso", label: "Peso (kg):" },
  ];

  return (
    <VehicleListScreen
      navigation={navigation}
      title="Trânsito de Veículos"
      subtitle={`Filial: ${state.selectedFilial}`}
      data={data}
      loading={loading}
      error={error}
      lastUpdate={lastUpdate}
      onRefresh={refresh}
      fields={fields}
      emptyMessage="Nenhum trânsito encontrado"
      emptyIcon="🚛"
      filtroServico={filtroServico}
      setFiltroServico={setFiltroServico}
      filtroOpPadrao={filtroOpPadrao}
      setFiltroOpPadrao={setFiltroOpPadrao}
      onRefresh={refresh}
      onApplyFilters={applyFiltersAndRefresh}
    />
  );
};

export default TransitoScreen;
