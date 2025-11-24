import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    target?: string; // ID del elemento a destacar
    screen: string; // En qué pantalla debe mostrarse este paso
    waitForAction?: boolean; // Si debe esperar a que el usuario complete algo
    actionType?: 'create-zone' | 'tap-button' | 'toggle-switch' | 'navigate' | 'none';
    nextScreen?: string; // A dónde navegar cuando presione "Siguiente"
}

interface TutorialContextType {
    isActive: boolean;
    currentStep: number;
    steps: TutorialStep[];
    currentScreen: string;
    startTutorial: () => void;
    nextStep: () => void;
    goToStep: (stepIndex: number) => void;
    skipTutorial: () => void;
    completeTutorial: () => void;
    hasCompletedTutorial: boolean;
    setCurrentScreen: (screen: string) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Pasos del tutorial INTERACTIVO
const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        title: '¡Bienvenido a AgroMind! 🌱',
        description: 'Te voy a guiar paso a paso para configurar tu primer sistema de riego inteligente. Empecemos creando tu primera zona.',
        screen: 'dashboard',
        actionType: 'none',
    },
    {
        id: 'create-zone-button',
        title: 'Crear tu Primera Zona',
        description: 'Toca el botón "Agregar Zona" para crear tu primera zona de cultivo.',
        screen: 'dashboard',
        target: 'add-zone-button',
        waitForAction: true,
        actionType: 'navigate',
        nextScreen: '/add-zone',
    },
    {
        id: 'zone-form-intro',
        title: 'Formulario de Zona',
        description: 'Completa los datos de tu zona. Dale un nombre como "Jardín Principal" y selecciona si es Interior o Exterior.',
        screen: 'add-zone',
        actionType: 'none',
    },
    {
        id: 'zone-name-input',
        title: 'Nombre de la Zona',
        description: 'El nombre te ayudará a identificar fácilmente esta zona cuando tengas varias configuradas.',
        screen: 'add-zone',
        target: 'zone-name-input',
        actionType: 'none',
    },
    {
        id: 'zone-type-select',
        title: 'Tipo de Zona',
        description: 'Exterior: recibe luz solar y lluvia natural.\nInterior: invernadero o cultivo indoor sin clima natural.',
        screen: 'add-zone',
        target: 'zone-type-select',
        actionType: 'none',
    },
    {
        id: 'create-zone-action',
        title: 'Crear la Zona',
        description: 'Ahora presiona el botón "Crear Zona" para guardarla. Te esperaré aquí...',
        screen: 'add-zone',
        target: 'create-zone-button',
        waitForAction: true,
        actionType: 'create-zone',
    },
    {
        id: 'dashboard-intro',
        title: '¡Zona Creada! 🎉',
        description: 'Perfecto. Ahora estás en el Panel de Control donde verás todos los datos en tiempo real de tus sensores.',
        screen: 'dashboard',
        actionType: 'none',
    },
    {
        id: 'moisture-circle',
        title: 'Humedad del Suelo',
        description: 'Este círculo muestra el nivel actual de humedad.\n\n🟢 Verde = Óptimo (más de 30%)\n🔴 Rojo = Crítico (necesita riego)',
        screen: 'dashboard',
        target: 'moisture-circle',
        actionType: 'none',
    },
    {
        id: 'sensors-info',
        title: 'Sensores Secundarios',
        description: 'A la derecha ves temperatura, nivel del tanque y luz. El sistema monitorea todo en tiempo real.',
        screen: 'dashboard',
        actionType: 'none',
    },
    {
        id: 'manual-water',
        title: 'Riego Manual',
        description: 'Si necesitas regar manualmente, usa este botón. El sistema regará por 5 segundos automáticamente.',
        screen: 'dashboard',
        target: 'manual-water-button',
        actionType: 'none',
    },
    {
        id: 'auto-mode',
        title: 'Modo Automático',
        description: 'Este interruptor activa/desactiva el riego automático. Cuando está activo, el sistema riega solo cuando la humedad baja del umbral.',
        screen: 'dashboard',
        target: 'auto-mode-switch',
        actionType: 'none',
    },
    {
        id: 'go-to-config',
        title: 'Ir a Configuración',
        description: 'Ahora vamos a ajustar los parámetros. Presiona "Siguiente" para ir a Configuración.',
        screen: 'dashboard',
        actionType: 'none',
        nextScreen: '/(tabs)/configuration',
    },
    {
        id: 'config-intro',
        title: 'Configuración de Zona',
        description: 'Aquí puedes ajustar el umbral de riego, duración y opciones del clima.',
        screen: 'configuration',
        actionType: 'none',
    },
    {
        id: 'threshold-slider',
        title: 'Umbral de Riego',
        description: 'Este es el valor mínimo de humedad. Cuando baje de aquí, el sistema activará el riego.\n\nEjemplo: 30% para plantas que necesitan suelo húmedo.',
        screen: 'configuration',
        target: 'threshold-slider',
        actionType: 'none',
    },
    {
        id: 'weather-api',
        title: 'API del Clima',
        description: 'Si activas esto, el sistema consultará el pronóstico del clima. Si va a llover, cancelará el riego automático (solo zonas exteriores).',
        screen: 'configuration',
        target: 'weather-api-toggle',
        actionType: 'none',
    },
    {
        id: 'complete',
        title: '¡Tutorial Completado! 🎉',
        description: '¡Excelente! Ya sabes cómo usar AgroMind.\n\nEl sistema ahora puede:\n✅ Regar automáticamente\n✅ Monitorear sensores 24/7\n✅ Respetar el clima\n\n¡Tus plantas están en buenas manos!',
        screen: 'configuration',
        actionType: 'none',
    },
];

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentScreen, setCurrentScreen] = useState('dashboard');
    const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

    useEffect(() => {
        checkTutorialStatus();
    }, []);

    const checkTutorialStatus = async () => {
        try {
            const completed = await AsyncStorage.getItem('tutorialCompleted');
            if (completed === 'true') {
                setHasCompletedTutorial(true);
            }
        } catch (error) {
            console.error('Error checking tutorial status:', error);
        }
    };

    const startTutorial = () => {
        setIsActive(true);
        setCurrentStep(0);
    };

    const nextStep = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeTutorial();
        }
    };

    const goToStep = (stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < TUTORIAL_STEPS.length) {
            setCurrentStep(stepIndex);
        }
    };

    const skipTutorial = async () => {
        setIsActive(false);
        await AsyncStorage.setItem('tutorialCompleted', 'true');
        setHasCompletedTutorial(true);
    };

    const completeTutorial = async () => {
        setIsActive(false);
        await AsyncStorage.setItem('tutorialCompleted', 'true');
        setHasCompletedTutorial(true);
    };

    return (
        <TutorialContext.Provider
            value={{
                isActive,
                currentStep,
                steps: TUTORIAL_STEPS,
                currentScreen,
                startTutorial,
                nextStep,
                goToStep,
                skipTutorial,
                completeTutorial,
                hasCompletedTutorial,
                setCurrentScreen,
            }}
        >
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
