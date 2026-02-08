'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import ModelPerformanceCharts from '@/src/components/ModelPerformanceCharts';
import ModelSeriesList from '@/src/components/ModelSeriesList';
import { getModelRankings, ModelDetailRankings, getModelSeriesByDefinition, ModelSeriesByDefinition, getModelDetails, ModelDetails } from '@/src/services/modelService';

export default function ModelDetailPage() {
  const params = useParams();
  const modelId = params.modelId as string;
  
  const [modelDetails, setModelDetails] = useState<ModelDetails | null>(null);
  const [rankingsData, setRankingsData] = useState<ModelDetailRankings | null>(null);
  const [seriesData, setSeriesData] = useState<ModelSeriesByDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!modelId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [details, rankings, series] = await Promise.all([
          getModelDetails(modelId),
          getModelRankings(modelId),
          getModelSeriesByDefinition(modelId)
        ]);
        setModelDetails(details);
        setRankingsData(rankings);
        setSeriesData(series);
      } catch (error) {
        console.error('Error fetching model data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [modelId]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: 'Rankings', href: '/' },
            { label: `Model #${modelId}`, href: `/models/${modelId}` }
          ]} 
        />

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Model Details</h1>
          
          {loading ? (
            <div className="text-center">
              <div className="text-lg text-gray-600">Loading model details...</div>
            </div>
          ) : modelDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Model Name
                </label>
                <div className="text-lg text-gray-900">{modelDetails.name}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Model ID
                </label>
                <div className="text-lg text-gray-900 font-mono">{modelDetails.readable_id}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Model Family
                </label>
                <div className="text-lg text-gray-900">{modelDetails.model_family}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Model Size
                </label>
                <div className="text-lg text-gray-900">{modelDetails.model_size.toLocaleString()} parameters</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Hosting
                </label>
                <div className="text-lg text-gray-900">{modelDetails.hosting}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Architecture
                </label>
                <div className="text-lg text-gray-900">{modelDetails.architecture}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Pretraining Data
                </label>
                <div className="text-lg text-gray-900">{modelDetails.pretraining_data}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Publishing Date
                </label>
                <div className="text-lg text-gray-900">
                  {new Date(modelDetails.publishing_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-lg text-gray-600">Failed to load model details.</div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Performance by Challenge</h2>
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-lg text-gray-600">Loading rankings...</div>
            </div>
          ) : rankingsData ? (
            <ModelPerformanceCharts definitionRankings={rankingsData.definition_rankings} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-lg text-gray-600">Failed to load rankings data.</div>
            </div>
          )}
        </div>

        <div>
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-lg text-gray-600">Loading series data...</div>
            </div>
          ) : seriesData ? (
            <ModelSeriesList definitions={seriesData.definitions} modelId={modelId} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-lg text-gray-600">Failed to load series data.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
