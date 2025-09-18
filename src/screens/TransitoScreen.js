import React from "react";
import VehicleListScreen from "../components/VehicleListScreen";
import { useVehicleData } from "../hooks/useVehicleData";
import { useApp } from "../context/AppContext";
import { formatDateTime } from "../utils/formatters";

const TransitoScreen = ({ navigation, route }) => {
  const { state } = useApp();
  const { data, loading, lastUpdate, error, refresh } =
    useVehicleData("transito");

  React.useEffect(() => {
    if (data && data.length > 0) {
      console.log("[TransitoScreen] Data sample:", data[0]);
      console.log("[TransitoScreen] All keys:", Object.keys(data[0] || {}));
    }
  }, [data]);

  const fields = [
    { key: "origem", label: "Origem:" },
    { key: "destino", label: "Destino:" },
    { key: "produto", label: "Produto:" },
    { key: "peso", label: "Peso:" },
    { key: "motorista", label: "Motorista:" },
    { key: "placa", label: "Placa:" },
    { key: "situacao", label: "Situação:" },
    {
      key: "data_saida",
      label: "Data Saída:",
      format: (value) =>
        value ? formatDateTime(value, { includeTime: false }) : "N/A",
    },
  ];

  return (
    <VehicleListScreen
      navigation={navigation}
      title="Veículos em Trânsito"
      subtitle={`Filial: ${state.selectedFilial}`}
      data={data}
      loading={loading}
      error={error}
      lastUpdate={lastUpdate}
      onRefresh={refresh}
      fields={fields}
      emptyMessage="Nenhum veículo em trânsito"
      emptyIcon="🚛"
    />
  );
};

export default TransitoScreen;
