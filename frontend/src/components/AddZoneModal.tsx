import React, { useState } from 'react';
import { X, Wifi, Cpu, CheckCircle2, AlertCircle, Loader2, Leaf, Home, Flower2, Check, ChevronRight, RefreshCw } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { useAuth } from '../context/AuthContext';
import esp32Service from '../services/esp32Service';
import type { ESP32DeviceInfo } from '../types';

interface AddZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (zone: { name: string; type: 'Outdoor' | 'Indoor' | 'Greenhouse' }) => void;
}

type ConnectionStep = 'form' | 'creating' | 'scanning' | 'pairing' | 'testing' | 'success' | 'error';

const AddZoneModal: React.FC<AddZoneModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<'Outdoor' | 'Indoor' | 'Greenhouse'>('Outdoor');
  const [manualIP, setManualIP] = useState('');
  
  const [step, setStep] = useState<ConnectionStep>('form');
  const [createdZoneId, setCreatedZoneId] = useState<number | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<ESP32DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ESP32DeviceInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState({
    zoneCreated: false,
    espFound: false,
    espPaired: false,
    sensorsReading: false,
  });

  const resetModal = () => {
    setName('');
    setType('Outdoor');
    setManualIP('');
    setStep('form');
    setCreatedZoneId(null);
    setDiscoveredDevices([]);
    setSelectedDevice(null);
    setErrorMessage('');
    setConnectionStatus({ zoneCreated: false, espFound: false, espPaired: false, sensorsReading: false });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user?.id) return;
    
    setStep('creating');
    
    try {
      const defaultSensors = { soilMoisture: null, temperature: null, humidity: null, lightLevel: null, tankLevel: null, waterLevel: null };
      const defaultStatus = { pump: 'OFF', connection: 'OFFLINE', lastWatered: 'Nunca', lastUpdate: null, hasSensorData: false };
      const defaultConfig = { moistureThreshold: 30, wateringDuration: 10, autoMode: false, respectRainForecast: false, useWeatherApi: false };

      const response = await fetch(`${API_CONFIG.BASE_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name, type, sensors: defaultSensors, status: defaultStatus, config: defaultConfig }),
      });

      if (!response.ok) throw new Error('Error al crear la zona');

      const data = await response.json();
      const newZoneId = data.id;
      setCreatedZoneId(newZoneId);
      setConnectionStatus(prev => ({ ...prev, zoneCreated: true }));

      setStep('scanning');

      let devices: ESP32DeviceInfo[] = [];
      
      if (manualIP.trim()) {
        const device = await esp32Service.testESP32Connection(manualIP.trim());
        if (device && !device.configured) {
          devices = [device];
        }
      }
      
      if (devices.length === 0) {
        devices = await esp32Service.scanForESP32Devices();
        devices = devices.filter(d => !d.configured);
      }
      
      setDiscoveredDevices(devices);
      
      if (devices.length === 0) {
        setStep('error');
        setErrorMessage('No se encontró ningún ESP32 disponible en la red.\n\nAsegúrate de que el ESP32 esté encendido y conectado a la misma red WiFi.');
        return;
      }
      
      setConnectionStatus(prev => ({ ...prev, espFound: true }));
      
      if (devices.length === 1) {
        await pairDevice(devices[0], newZoneId);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error al crear la zona');
    }
  };

  const pairDevice = async (device: ESP32DeviceInfo, zoneId: number) => {
    try {
      setStep('pairing');
      setSelectedDevice(device);
      
      const pairResult = await esp32Service.pairESP32(device.ip, zoneId);
      
      if (!pairResult.success) {
        throw new Error(pairResult.message || 'Error al emparejar');
      }
      
      setConnectionStatus(prev => ({ ...prev, espPaired: true }));
      
      setStep('testing');
      
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const zoneCheck = await fetch(`${API_CONFIG.BASE_URL}/zones/detail/${zoneId}`);
          if (zoneCheck.ok) {
            const zoneData = await zoneCheck.json();
            if (zoneData.status?.connection === 'ONLINE' || zoneData.status?.hasSensorData) {
              setConnectionStatus(prev => ({ ...prev, sensorsReading: true }));
              break;
            }
          }
        } catch (e) {
          console.log('Verificando sensores...', attempt + 1);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setStep('success');
      
    } catch (error) {
      console.error('Pair error:', error);
      setStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error al emparejar');
      
      if (createdZoneId) {
        try {
          await fetch(`${API_CONFIG.BASE_URL}/zones/${createdZoneId}`, { method: 'DELETE' });
        } catch (e) {
          console.error('Error deleting zone:', e);
        }
      }
    }
  };

  const handleSelectDevice = (device: ESP32DeviceInfo) => {
    if (createdZoneId) {
      pairDevice(device, createdZoneId);
    }
  };

  const handleFinish = () => {
    onAdd({ name, type });
    resetModal();
  };

  const getStepStatus = (stepKey: string): 'pending' | 'active' | 'done' => {
    const stepOrder = ['creating', 'scanning', 'pairing', 'testing'];
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (step === 'error') {
      if (stepKey === 'creating' && connectionStatus.zoneCreated) return 'done';
      if (stepKey === 'scanning' && connectionStatus.espFound) return 'done';
      return 'pending';
    }
    
    if (
      (stepKey === 'creating' && connectionStatus.zoneCreated) ||
      (stepKey === 'scanning' && connectionStatus.espFound) ||
      (stepKey === 'pairing' && connectionStatus.espPaired) ||
      (stepKey === 'testing' && connectionStatus.sensorsReading)
    ) {
      return 'done';
    }
    
    if (step === stepKey) return 'active';
    if (stepIndex < currentIndex) return 'done';
    
    return 'pending';
  };

  const getProgressWidth = () => {
    switch (step) {
      case 'creating': return '25%';
      case 'scanning': return '50%';
      case 'pairing': return '75%';
      case 'testing': return '90%';
      case 'success': return '100%';
      default: return '0%';
    }
  };

  if (!isOpen) return null;

  const zoneTypes = [
    { value: 'Outdoor' as const, label: 'Exterior', icon: Leaf, color: 'emerald' },
    { value: 'Indoor' as const, label: 'Interior', icon: Home, color: 'blue' },
    { value: 'Greenhouse' as const, label: 'Invernadero', icon: Flower2, color: 'orange' },
  ];

  const connectionSteps = [
    { key: 'creating', label: 'Creando zona', sub: 'Registrando en el servidor' },
    { key: 'scanning', label: 'Buscando ESP32', sub: 'Escaneando la red local' },
    { key: 'pairing', label: 'Emparejando', sub: 'Vinculando dispositivo' },
    { key: 'testing', label: 'Verificando', sub: 'Probando sensores' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              step === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
            }`}>
              {step === 'error' ? (
                <AlertCircle size={24} className="text-red-500" />
              ) : (
                <Cpu size={24} className="text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {step === 'form' ? 'Nueva Zona' : 
               step === 'success' ? '¡Conexión Exitosa!' :
               step === 'error' ? 'Error de Conexión' :
               'Conectando ESP32'}
            </h3>
          </div>
          {step === 'form' && (
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Formulario inicial */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Nombre de la zona */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Zona
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Ej: Jardín Trasero"
              />
            </div>

            {/* Tipo de zona */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Zona
              </label>
              <div className="space-y-2">
                {zoneTypes.map((option) => {
                  const Icon = option.icon;
                  const isSelected = type === option.value;
                  const colorMap: Record<string, { bg: string; icon: string; border: string; check: string }> = {
                    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500', check: 'bg-emerald-500' },
                    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500', check: 'bg-blue-500' },
                    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', icon: 'text-orange-500', border: 'border-orange-500', check: 'bg-orange-500' },
                  };
                  const colorClasses = colorMap[option.color] || colorMap.emerald;
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? `${colorClasses.border} bg-white dark:bg-gray-700` 
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${colorClasses.bg} flex items-center justify-center mr-3`}>
                        <Icon size={20} className={isSelected ? colorClasses.icon : 'text-gray-400'} />
                      </div>
                      <span className={`flex-1 text-left font-medium ${
                        isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <div className={`w-5 h-5 ${colorClasses.check} rounded-full flex items-center justify-center`}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info card */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Wifi size={20} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                El ESP32 debe estar encendido y conectado a la misma red WiFi.
              </p>
            </div>

            {/* IP del ESP32 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                IP del ESP32 (opcional)
              </label>
              <input
                type="text"
                value={manualIP}
                onChange={(e) => setManualIP(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="Ej: 192.168.1.100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Si conoces la IP, ingrésala. Si no, se buscará automáticamente.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/30"
              >
                Crear y Conectar
              </button>
            </div>
          </form>
        )}

        {/* Pasos de conexión */}
        {(step === 'creating' || step === 'scanning' || step === 'pairing' || step === 'testing') && (
          <div className="p-6 space-y-6">
            {/* Barra de progreso */}
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: getProgressWidth() }}
              />
            </div>

            {/* Pasos */}
            <div className="space-y-0">
              {connectionSteps.map((s, index) => {
                const status = getStepStatus(s.key);
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex items-center gap-4 py-2">
                      {/* Icono del paso */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        status === 'done' ? 'bg-emerald-500' :
                        status === 'active' ? 'bg-emerald-500' :
                        'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        {status === 'done' ? (
                          <Check size={18} className="text-white" />
                        ) : status === 'active' ? (
                          <Loader2 size={18} className="text-white animate-spin" />
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 font-semibold">{index + 1}</span>
                        )}
                      </div>
                      
                      {/* Texto */}
                      <div>
                        <p className={`font-semibold ${
                          status === 'done' ? 'text-emerald-700 dark:text-emerald-400' :
                          status === 'active' ? 'text-gray-900 dark:text-white' :
                          'text-gray-400 dark:text-gray-500'
                        }`}>
                          {s.label}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{s.sub}</p>
                      </div>
                    </div>
                    
                    {/* Conector */}
                    {index < connectionSteps.length - 1 && (
                      <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-600 ml-5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Lista de dispositivos si hay varios */}
            {step === 'scanning' && discoveredDevices.length > 1 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Selecciona un ESP32:
                </p>
                <div className="space-y-2">
                  {discoveredDevices.map((device) => (
                    <button
                      key={device.mac}
                      onClick={() => handleSelectDevice(device)}
                      className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-emerald-500 transition-all"
                    >
                      <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <Cpu size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">{device.device}</p>
                        <p className="text-sm text-gray-500">IP: {device.ip}</p>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dispositivo seleccionado */}
            {(step === 'pairing' || step === 'testing') && selectedDevice && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl space-y-2">
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Cpu size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Dispositivo</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedDevice.ip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Éxito */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Check size={40} className="text-white" />
              </div>
            </div>
            
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                Tu zona <span className="font-bold text-gray-900 dark:text-white">"{name}"</span> está lista y el ESP32 está conectado.
              </p>
            </div>
            
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                <span>Zona creada</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                <span>ESP32 conectado</span>
              </div>
            </div>
            
            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              Ir al Dashboard
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <X size={40} className="text-red-500" />
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {errorMessage}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={resetModal}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setStep('form');
                  setErrorMessage('');
                  setConnectionStatus({ zoneCreated: false, espFound: false, espPaired: false, sensorsReading: false });
                }}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddZoneModal;
