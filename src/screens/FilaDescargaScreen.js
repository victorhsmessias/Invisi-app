import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const FilaDescargaScreen = ({ navigation, route }) => {
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
  } = useVehicleData("fila_descarga");

  React.useEffect(() => {
    if (data && data.length > 0) {
      console.log("[FilaDescargaScreen] Data sample:", data[0]);
      console.log("[FilaDescargaScreen] All keys:", Object.keys(data[0] || {}));
    }
  }, [data]);

  const fields = [
    { key: "fd_fila", label: "Fila:" },
    { key: "fd_produto", label: "Produto:" },
    { key: "fd_peso", label: "Peso (kg):" },
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
      filtroServico={filtroServico}
      setFiltroServico={setFiltroServico}
      filtroOpPadrao={filtroOpPadrao}
      setFiltroOpPadrao={setFiltroOpPadrao}
      onApplyFilters={applyFiltersAndRefresh}
    />
  );
};

export default FilaDescargaScreen;