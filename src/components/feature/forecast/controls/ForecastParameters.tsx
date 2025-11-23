import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ForecastParametersProps, Scenario } from './types';

export const ForecastParameters: React.FC<ForecastParametersProps> = ({
  forecastDays,
  sellingPrice,
  scenario,
  includeConfidence,
  onDaysChange,
  onPriceChange,
  onScenarioChange,
  onConfidenceChange,
  disabled
}) => {
  const scenarios: Scenario[] = [
    { id: 'optimistic', name: 'Optimistic', description: 'Best case scenario' },
    { id: 'realistic', name: 'Realistic', description: 'Balanced scenario' },
    { id: 'pessimistic', name: 'Pessimistic', description: 'Worst case scenario' },
    { id: 'ndvi-vegetative', name: 'NDVI Vegetative', description: 'Based on satellite NDVI data - vegetative phase' },
    { id: 'ndvi-flowering', name: 'NDVI Flowering', description: 'Based on satellite NDVI data - flowering phase' },
    { id: 'ndvi-harvest', name: 'NDVI Harvest', description: 'Based on satellite NDVI data - harvest phase' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Forecast Days</Label>
            <Input
              type="number"
              min="1"
              max="365"
              value={forecastDays}
              onChange={(e) => onDaysChange(parseInt(e.target.value) || 14)}
              disabled={disabled}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Selling Price (Rp)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
              disabled={disabled}
              placeholder="Optional"
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Forecast Scenario</Label>
            <Select value={scenario} onValueChange={onScenarioChange} disabled={disabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Include Confidence Intervals</Label>
              <div className="text-xs text-muted-foreground">Show forecast uncertainty ranges</div>
            </div>
            <Switch
              checked={includeConfidence}
              onCheckedChange={onConfidenceChange}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* NDVI Integration Section */}
      {(scenario.includes('ndvi')) && (
        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <Label className="text-sm font-medium text-green-800 dark:text-green-200">NDVI Satellite Integration Active</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data Source:</span>
              <div className="font-medium">Sentinel-2 Satellite</div>
            </div>
            <div>
              <span className="text-muted-foreground">Coverage:</span>
              <div className="font-medium">West Java Region</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Update:</span>
              <div className="font-medium">2024-01-15</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-green-700 dark:text-green-300">
            Forecast will incorporate real-time vegetation health data for improved accuracy
          </div>
        </div>
      )}
    </div>
  );
};
