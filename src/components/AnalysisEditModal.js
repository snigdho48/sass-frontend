import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import DatePicker from './DatePicker';
import { dataService } from '../services/dataService';

const COOLING_FIELDS = [
  { key: 'ph', label: 'pH' },
  { key: 'tds', label: 'TDS (ppm)' },
  { key: 'total_alkalinity', label: 'Total Alkalinity (ppm)' },
  { key: 'hardness', label: 'Hardness (ppm)' },
  { key: 'chloride', label: 'Chloride (ppm)' },
  { key: 'basin_temperature', label: 'Basin Temperature (°C)' },
  { key: 'temperature', label: 'Hot Side Temperature (°C)' },
  { key: 'sulphate', label: 'Sulphate (ppm)' },
  { key: 'cycle', label: 'Cycle' },
  { key: 'iron', label: 'Iron (ppm)' },
  { key: 'phosphate', label: 'Phosphate (ppm)' },
];

const BOILER_FIELDS = [
  { key: 'ph', label: 'pH' },
  { key: 'tds', label: 'TDS (ppm)' },
  { key: 'hardness', label: 'Hardness (ppm)' },
  { key: 'm_alkalinity', label: 'M-Alkalinity (ppm)' },
  { key: 'p_alkalinity', label: 'P-Alkalinity (ppm)' },
  { key: 'oh_alkalinity', label: 'OH-Alkalinity (ppm)' },
  { key: 'sulphite', label: 'Sulphite (ppm)' },
  { key: 'sodium_chloride', label: 'Sodium Chloride (ppm)' },
  { key: 'iron', label: 'Iron (ppm)' },
  { key: 'do', label: 'Dissolved Oxygen (ppm)' },
  { key: 'boiler_phosphate', label: 'Phosphate (ppm)' },
];

const emptyToNull = (value) => {
  if (value === '' || value === undefined) return null;
  return value;
};

const AnalysisEditModal = ({
  analysisId,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [formData, setFormData] = useState({});
  const [dateTime, setDateTime] = useState('');

  // Lock background scroll while the modal is open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!analysisId) return;
      setLoading(true);
      try {
        const data = await dataService.getWaterAnalysis(analysisId);
        if (!mounted) return;
        setAnalysis(data);
        setFormData({
          ph: data.ph ?? '',
          tds: data.tds ?? '',
          total_alkalinity: data.total_alkalinity ?? '',
          hardness: data.hardness ?? '',
          chloride: data.chloride ?? '',
          basin_temperature: data.basin_temperature ?? '',
          temperature: data.temperature ?? '',
          sulphate: data.sulphate ?? '',
          cycle: data.cycle ?? '',
          iron: data.iron ?? '',
          phosphate: data.phosphate ?? '',
          m_alkalinity: data.m_alkalinity ?? '',
          p_alkalinity: data.p_alkalinity ?? '',
          oh_alkalinity: data.oh_alkalinity ?? '',
          sulphite: data.sulphite ?? '',
          sodium_chloride: data.sodium_chloride ?? '',
          do: data.do ?? '',
          boiler_phosphate: data.boiler_phosphate ?? '',
          notes: data.notes ?? '',
          analysis_name: data.analysis_name ?? 'Water Analysis',
        });
        const datePart = data.analysis_date || format(new Date(), 'yyyy-MM-dd');
        const timePart = (data.analysis_time || '00:00:00').slice(0, 5);
        setDateTime(`${datePart}T${timePart}`);
      } catch (error) {
        toast.error(error.message || 'Failed to load analysis');
        onClose?.();
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [analysisId, onClose]);

  const fields = useMemo(
    () => (analysis?.analysis_type === 'boiler' ? BOILER_FIELDS : COOLING_FIELDS),
    [analysis?.analysis_type]
  );

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!analysisId || !dateTime) return;
    setSaving(true);
    try {
      const parsed = parseISO(dateTime);
      const payload = {
        analysis_date: format(parsed, 'yyyy-MM-dd'),
        analysis_time: format(parsed, 'HH:mm'),
        analysis_name: formData.analysis_name || 'Water Analysis',
        notes: formData.notes || '',
      };
      fields.forEach(({ key }) => {
        payload[key] = emptyToNull(formData[key]);
      });

      const updated = await dataService.updateWaterAnalysis(analysisId, payload);
      toast.success('Analysis updated successfully');
      onSaved?.(updated);
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to update analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!analysisId) return;
    const confirmed = window.confirm(
      'Delete this analysis record? This cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await dataService.deleteWaterAnalysis(analysisId);
      toast.success('Analysis deleted');
      onDeleted?.(analysisId);
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to delete analysis');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto ui-overlay-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-edit-title"
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white dark:bg-gray-800 shadow-xl ui-modal-enter">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3">
            <div>
              <h3
                id="analysis-edit-title"
                className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Edit Analysis
              </h3>
              {analysis && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {[analysis.plant_name, analysis.water_system_name]
                    .filter(Boolean)
                    .join(' — ') || 'Water system'}
                  {' · '}
                  {analysis.analysis_type === 'boiler' ? 'Boiler' : 'Cooling'}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="px-4 sm:px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date &amp; Time <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={dateTime}
                    onChange={setDateTime}
                    ariaLabel="Analysis date and time"
                  />
                </div>

                {fields.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData[key] ?? ''}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="input w-full"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes ?? ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    className="input w-full"
                  />
                </div>

                {(analysis?.stability_score != null || analysis?.overall_status) && (
                  <div className="sm:col-span-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Current results: score{' '}
                    <strong>{analysis.stability_score ?? '--'}</strong>
                    {analysis.overall_status ? ` · ${analysis.overall_status}` : ''}
                    . Saving recalculates indices automatically.
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Record'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving || deleting}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || deleting}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisEditModal;
