import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Switch,
    TextInput,
    Modal,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Zone, WateringSchedule, VacationMode } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../styles/theme';
import { API_CONFIG } from '../../constants/api';

const DAYS = [
    { key: 'lun', label: 'L' },
    { key: 'mar', label: 'M' },
    { key: 'mié', label: 'X' },
    { key: 'jue', label: 'J' },
    { key: 'vie', label: 'V' },
    { key: 'sáb', label: 'S' },
    { key: 'dom', label: 'D' },
];

const DEFAULT_VACATION: VacationMode = {
    enabled: false,
    startDate: null,
    endDate: null,
    reducedWatering: true,
    reductionPercent: 50,
};

export default function SchedulesScreen() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<string>('');
    const [schedules, setSchedules] = useState<WateringSchedule[]>([]);
    const [vacationMode, setVacationMode] = useState<VacationMode>(DEFAULT_VACATION);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Estado para nuevo horario
    const [newSchedule, setNewSchedule] = useState<Partial<WateringSchedule>>({
        time: '08:00',
        days: ['lun', 'mié', 'vie'],
        enabled: true,
        duration: 30,
    });

    const selectedZone = zones.find(z => z.id.toString() === selectedZoneId);

    useFocusEffect(
        useCallback(() => {
            loadZones();
        }, [])
    );

    useEffect(() => {
        if (selectedZone) {
            const config = selectedZone.config as any;
            setSchedules(config?.schedules || []);
            setVacationMode(config?.vacationMode || DEFAULT_VACATION);
        }
    }, [selectedZone]);

    const loadZones = async () => {
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/zones/${user?.id}`);
            if (res.ok) {
                const data = await res.json();
                setZones(data);
                if (data.length > 0 && !selectedZoneId) {
                    setSelectedZoneId(data[0].id.toString());
                }
            }
        } catch (error) {
            console.error('Error loading zones:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (newSchedules: WateringSchedule[], newVacation: VacationMode) => {
        if (!selectedZone) return;
        
        setSaving(true);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/zones/${selectedZone.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config: {
                        ...selectedZone.config,
                        schedules: newSchedules,
                        vacationMode: newVacation,
                    }
                })
            });

            if (response.ok) {
                // Actualizar estado local
                setZones(prev => prev.map(z => 
                    z.id === selectedZone.id 
                        ? {
                            ...z,
                            config: {
                                ...z.config,
                                schedules: newSchedules,
                                vacationMode: newVacation,
                            }
                        }
                        : z
                ));
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const addSchedule = () => {
        const schedule: WateringSchedule = {
            id: Date.now().toString(),
            time: newSchedule.time || '08:00',
            days: newSchedule.days || ['lun', 'mié', 'vie'],
            enabled: true,
            duration: newSchedule.duration || 30,
        };

        const updated = [...schedules, schedule];
        setSchedules(updated);
        saveConfig(updated, vacationMode);
        setShowAddModal(false);
        setNewSchedule({
            time: '08:00',
            days: ['lun', 'mié', 'vie'],
            enabled: true,
            duration: 30,
        });
    };

    const toggleSchedule = (id: string) => {
        const updated = schedules.map(s => 
            s.id === id ? { ...s, enabled: !s.enabled } : s
        );
        setSchedules(updated);
        saveConfig(updated, vacationMode);
    };

    const deleteSchedule = (id: string) => {
        Alert.alert(
            'Eliminar horario',
            '¿Estás seguro de eliminar este horario?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        const updated = schedules.filter(s => s.id !== id);
                        setSchedules(updated);
                        saveConfig(updated, vacationMode);
                    }
                }
            ]
        );
    };

    const toggleVacationMode = () => {
        const updated = { 
            ...vacationMode, 
            enabled: !vacationMode.enabled,
            startDate: !vacationMode.enabled ? new Date().toISOString() : null,
            endDate: !vacationMode.enabled 
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
                : null,
        };
        setVacationMode(updated);
        saveConfig(schedules, updated);
    };

    const updateVacationDates = (type: 'start' | 'end', date: Date) => {
        const updated = {
            ...vacationMode,
            [type === 'start' ? 'startDate' : 'endDate']: date.toISOString(),
        };
        setVacationMode(updated);
        saveConfig(schedules, updated);
    };

    const updateReductionPercent = (value: number) => {
        const updated = { ...vacationMode, reductionPercent: value };
        setVacationMode(updated);
        saveConfig(schedules, updated);
    };

    const toggleDay = (day: string) => {
        const current = newSchedule.days || [];
        const updated = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day];
        setNewSchedule({ ...newSchedule, days: updated });
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No definida';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.emerald[600]} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header />
            
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Título */}
                <View style={styles.headerSection}>
                    <Text style={[styles.title, { color: colors.text }]}>Horarios</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Programa el riego automático
                    </Text>
                </View>

                {/* Selector de zona */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.zoneSelector}
                >
                    {zones.map(zone => (
                        <TouchableOpacity
                            key={zone.id}
                            style={[
                                styles.zoneChip,
                                selectedZoneId === zone.id.toString() && styles.zoneChipActive,
                                { backgroundColor: selectedZoneId === zone.id.toString() ? Colors.emerald[600] : colors.card }
                            ]}
                            onPress={() => setSelectedZoneId(zone.id.toString())}
                        >
                            <Text style={[
                                styles.zoneChipText,
                                { color: selectedZoneId === zone.id.toString() ? '#fff' : colors.text }
                            ]}>
                                {zone.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Modo Vacaciones */}
                {vacationMode.enabled ? (
                    <LinearGradient
                        colors={[Colors.orange[500], Colors.amber[500]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.vacationCardGradient}
                    >
                        <View style={styles.vacationHeader}>
                            <View style={styles.vacationTitleRow}>
                                <View style={[styles.vacationIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                    <Ionicons name="sunny" size={20} color="#fff" />
                                </View>
                                <View>
                                    <Text style={[styles.vacationTitle, { color: '#fff' }]}>
                                        Modo Vacaciones
                                    </Text>
                                    <Text style={[styles.vacationSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                                        Riego reducido al {vacationMode.reductionPercent}%
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={vacationMode.enabled}
                                onValueChange={toggleVacationMode}
                                trackColor={{ false: Colors.gray[200], true: 'rgba(255,255,255,0.3)' }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={[styles.vacationDetails, { borderTopColor: 'rgba(255,255,255,0.2)' }]}>
                            <View style={styles.dateRow}>
                                <TouchableOpacity 
                                    style={[styles.dateButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                    onPress={() => setShowDatePicker('start')}
                                >
                                    <Ionicons name="calendar" size={16} color="#fff" />
                                    <View>
                                        <Text style={[styles.dateLabel, { color: 'rgba(255,255,255,0.8)' }]}>Inicio</Text>
                                        <Text style={[styles.dateValue, { color: '#fff' }]}>
                                            {formatDate(vacationMode.startDate)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />

                                <TouchableOpacity 
                                    style={[styles.dateButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                    onPress={() => setShowDatePicker('end')}
                                >
                                    <Ionicons name="calendar" size={16} color="#fff" />
                                    <View>
                                        <Text style={[styles.dateLabel, { color: 'rgba(255,255,255,0.8)' }]}>Fin</Text>
                                        <Text style={[styles.dateValue, { color: '#fff' }]}>
                                            {formatDate(vacationMode.endDate)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.reductionRow}>
                                <Text style={[styles.reductionLabel, { color: '#fff' }]}>
                                    Reducción de riego: {vacationMode.reductionPercent}%
                                </Text>
                                <View style={styles.reductionButtons}>
                                    {[25, 50, 75].map(percent => (
                                        <TouchableOpacity
                                            key={percent}
                                            style={[
                                                styles.reductionButton,
                                                { 
                                                    backgroundColor: vacationMode.reductionPercent === percent 
                                                        ? 'rgba(255,255,255,0.3)' 
                                                        : 'rgba(255,255,255,0.15)' 
                                                }
                                            ]}
                                            onPress={() => updateReductionPercent(percent)}
                                        >
                                            <Text style={[styles.reductionButtonText, { color: '#fff' }]}>
                                                {percent}%
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                ) : (
                    <Card style={[styles.vacationCard, { 
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    }]}>
                        <View style={styles.vacationHeader}>
                            <View style={styles.vacationTitleRow}>
                                <View style={[styles.vacationIcon, { backgroundColor: Colors.orange[100] }]}>
                                    <Ionicons name="sunny" size={20} color={Colors.orange[500]} />
                                </View>
                                <View>
                                    <Text style={[styles.vacationTitle, { color: colors.text }]}>
                                        Modo Vacaciones
                                    </Text>
                                    <Text style={[styles.vacationSubtitle, { color: colors.textSecondary }]}>
                                        Reduce el riego mientras no estás
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={vacationMode.enabled}
                                onValueChange={toggleVacationMode}
                                trackColor={{ false: Colors.gray[200], true: Colors.orange[500] }}
                                thumbColor="#fff"
                            />
                        </View>
                    </Card>
                )}

                {/* Lista de horarios */}
                <View style={styles.schedulesSection}>
                    <View style={styles.schedulesSectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Horarios programados
                        </Text>
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={() => setShowAddModal(true)}
                        >
                            <Ionicons name="add" size={20} color={Colors.emerald[600]} />
                            <Text style={styles.addButtonText}>Agregar</Text>
                        </TouchableOpacity>
                    </View>

                    {schedules.length === 0 ? (
                        <Card style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="calendar-outline" size={48} color={Colors.gray[300]} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No hay horarios programados
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Agrega uno para automatizar el riego
                            </Text>
                        </Card>
                    ) : (
                        schedules.map(schedule => (
                            <Card 
                                key={schedule.id} 
                                style={[
                                    styles.scheduleCard, 
                                    { 
                                        backgroundColor: colors.card, 
                                        borderColor: colors.border,
                                        opacity: schedule.enabled ? 1 : 0.6,
                                    }
                                ]}
                            >
                                <View style={styles.scheduleHeader}>
                                    <View style={styles.scheduleTime}>
                                        <Text style={[styles.timeText, { color: colors.text }]}>
                                            {formatTime(schedule.time)}
                                        </Text>
                                        <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                                            {schedule.duration} segundos
                                        </Text>
                                    </View>
                                    <View style={styles.scheduleActions}>
                                        <Switch
                                            value={schedule.enabled}
                                            onValueChange={() => toggleSchedule(schedule.id)}
                                            trackColor={{ false: Colors.gray[200], true: Colors.emerald[500] }}
                                            thumbColor="#fff"
                                        />
                                        <TouchableOpacity 
                                            style={styles.deleteButton}
                                            onPress={() => deleteSchedule(schedule.id)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={Colors.red[500]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                <View style={styles.daysRow}>
                                    {DAYS.map(day => (
                                        <View 
                                            key={day.key}
                                            style={[
                                                styles.dayBadge,
                                                schedule.days.includes(day.key) && styles.dayBadgeActive,
                                                { 
                                                    backgroundColor: schedule.days.includes(day.key) 
                                                        ? Colors.emerald[500] 
                                                        : Colors.gray[100] 
                                                }
                                            ]}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                { color: schedule.days.includes(day.key) ? '#fff' : Colors.gray[500] }
                                            ]}>
                                                {day.label}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </Card>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Modal para agregar horario */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Nuevo horario
                            </Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Selector de hora */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.formLabel, { color: colors.text }]}>Hora</Text>
                            <TouchableOpacity 
                                style={[styles.timeInput, { backgroundColor: colors.background }]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Ionicons name="time" size={20} color={Colors.emerald[500]} />
                                <Text style={[styles.timeInputText, { color: colors.text }]}>
                                    {formatTime(newSchedule.time || '08:00')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Selector de días */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.formLabel, { color: colors.text }]}>Días</Text>
                            <View style={styles.daysSelector}>
                                {DAYS.map(day => (
                                    <TouchableOpacity
                                        key={day.key}
                                        style={[
                                            styles.daySelectorBadge,
                                            (newSchedule.days || []).includes(day.key) && styles.daySelectorBadgeActive,
                                            { 
                                                backgroundColor: (newSchedule.days || []).includes(day.key) 
                                                    ? Colors.emerald[500] 
                                                    : colors.background 
                                            }
                                        ]}
                                        onPress={() => toggleDay(day.key)}
                                    >
                                        <Text style={[
                                            styles.daySelectorText,
                                            { color: (newSchedule.days || []).includes(day.key) ? '#fff' : colors.text }
                                        ]}>
                                            {day.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Duración */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.formLabel, { color: colors.text }]}>
                                Duración (segundos)
                            </Text>
                            <View style={styles.durationInput}>
                                <TouchableOpacity
                                    style={[styles.durationButton, { backgroundColor: colors.background }]}
                                    onPress={() => setNewSchedule({
                                        ...newSchedule,
                                        duration: Math.max(10, (newSchedule.duration || 30) - 10)
                                    })}
                                >
                                    <Ionicons name="remove" size={20} color={colors.text} />
                                </TouchableOpacity>
                                <Text style={[styles.durationValue, { color: colors.text }]}>
                                    {newSchedule.duration || 30}s
                                </Text>
                                <TouchableOpacity
                                    style={[styles.durationButton, { backgroundColor: colors.background }]}
                                    onPress={() => setNewSchedule({
                                        ...newSchedule,
                                        duration: Math.min(300, (newSchedule.duration || 30) + 10)
                                    })}
                                >
                                    <Ionicons name="add" size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Botones */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { backgroundColor: colors.background }]}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={addSchedule}
                            >
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal
                visible={showTimePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTimePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>
                            Seleccionar hora
                        </Text>
                        <View style={styles.timePickerRow}>
                            {['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.timeOption,
                                        newSchedule.time === time && styles.timeOptionActive,
                                        { backgroundColor: newSchedule.time === time ? Colors.emerald[500] : colors.background }
                                    ]}
                                    onPress={() => {
                                        setNewSchedule({ ...newSchedule, time });
                                        setShowTimePicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.timeOptionText,
                                        { color: newSchedule.time === time ? '#fff' : colors.text }
                                    ]}>
                                        {formatTime(time)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.pickerCloseButton, { backgroundColor: colors.background }]}
                            onPress={() => setShowTimePicker(false)}
                        >
                            <Text style={[styles.pickerCloseText, { color: colors.text }]}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date Picker Modal */}
            <Modal
                visible={showDatePicker !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>
                            Seleccionar {showDatePicker === 'start' ? 'fecha de inicio' : 'fecha de fin'}
                        </Text>
                        <View style={styles.dateOptionsRow}>
                            {[
                                { label: 'Hoy', days: 0 },
                                { label: 'Mañana', days: 1 },
                                { label: 'En 3 días', days: 3 },
                                { label: 'En 1 semana', days: 7 },
                                { label: 'En 2 semanas', days: 14 },
                                { label: 'En 1 mes', days: 30 },
                            ].map(option => (
                                <TouchableOpacity
                                    key={option.days}
                                    style={[styles.dateOption, { backgroundColor: colors.background }]}
                                    onPress={() => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + option.days);
                                        if (showDatePicker) {
                                            updateVacationDates(showDatePicker, date);
                                        }
                                        setShowDatePicker(null);
                                    }}
                                >
                                    <Text style={[styles.dateOptionText, { color: colors.text }]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.pickerCloseButton, { backgroundColor: colors.background }]}
                            onPress={() => setShowDatePicker(null)}
                        >
                            <Text style={[styles.pickerCloseText, { color: colors.text }]}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Loading overlay */}
            {saving && (
                <View style={styles.savingOverlay}>
                    <ActivityIndicator size="large" color={Colors.emerald[600]} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: FontSizes.base,
        marginTop: Spacing.xs,
    },
    zoneSelector: {
        marginBottom: Spacing.lg,
    },
    zoneChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.sm,
    },
    zoneChipActive: {
        shadowColor: Colors.emerald[600],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    zoneChipText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    vacationCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    vacationCardGradient: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.lg,
    },
    vacationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    vacationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    vacationIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vacationTitle: {
        fontSize: FontSizes.base,
        fontWeight: '700',
    },
    vacationSubtitle: {
        fontSize: FontSizes.xs,
        marginTop: 2,
    },
    vacationDetails: {
        marginTop: Spacing.lg,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.purple[200],
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    dateLabel: {
        fontSize: FontSizes.xs,
    },
    dateValue: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    reductionRow: {
        marginTop: Spacing.lg,
    },
    reductionLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    reductionButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    reductionButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    reductionButtonActive: {},
    reductionButtonText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    schedulesSection: {
        marginTop: Spacing.md,
    },
    schedulesSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    addButtonText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        color: Colors.emerald[600],
    },
    emptyCard: {
        padding: Spacing.xxl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        marginTop: Spacing.md,
    },
    emptySubtext: {
        fontSize: FontSizes.sm,
        marginTop: Spacing.xs,
    },
    scheduleCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    scheduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    scheduleTime: {},
    timeText: {
        fontSize: 24,
        fontWeight: '700',
    },
    durationText: {
        fontSize: FontSizes.xs,
        marginTop: 2,
    },
    scheduleActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    deleteButton: {
        padding: Spacing.xs,
    },
    daysRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    dayBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayBadgeActive: {},
    dayText: {
        fontSize: FontSizes.xs,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl + 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: '700',
    },
    formGroup: {
        marginBottom: Spacing.lg,
    },
    formLabel: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    timeInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    timeInputText: {
        fontSize: FontSizes.xl,
        fontWeight: '600',
    },
    daysSelector: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    daySelectorBadge: {
        flex: 1,
        height: 44,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    daySelectorBadgeActive: {},
    daySelectorText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    durationInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.lg,
    },
    durationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationValue: {
        fontSize: 32,
        fontWeight: '700',
        minWidth: 80,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        backgroundColor: Colors.emerald[600],
    },
    saveButtonText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
        color: '#fff',
    },
    savingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerModal: {
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
    },
    pickerTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    timePickerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        justifyContent: 'center',
    },
    timeOption: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    timeOptionActive: {},
    timeOptionText: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    dateOptionsRow: {
        gap: Spacing.sm,
    },
    dateOption: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
    },
    dateOptionText: {
        fontSize: FontSizes.base,
        fontWeight: '500',
        textAlign: 'center',
    },
    pickerCloseButton: {
        marginTop: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    pickerCloseText: {
        fontSize: FontSizes.base,
        fontWeight: '600',
    },
});
