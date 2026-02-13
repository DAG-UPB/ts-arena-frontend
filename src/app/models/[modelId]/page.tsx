'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import ModelPerformanceCharts from '@/src/components/ModelPerformanceCharts';
import ModelSeriesList from '@/src/components/ModelSeriesList';
import DetailsCard from '@/src/components/DetailsCard';
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

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-lg text-gray-600">Loading model details...</div>
          </div>
        ) : modelDetails ? (
          <DetailsCard
            title={modelDetails.name}
            id={`Model ID: ${modelDetails.readable_id}`}
            fields={[
              {
                label: 'Model Family',
                value: modelDetails.model_family
              },
              {
                label: 'Architecture',
                value: modelDetails.architecture
              },
              {
                label: 'Model Size',
                value: `${modelDetails.model_size.toLocaleString()}M parameters`
              },
              {
                label: 'Pretraining Data',
                value: modelDetails.pretraining_data
              },
              {
                label: 'Publishing Date',
                value: new Date(modelDetails.publishing_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              }
            ]}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-lg text-gray-600">Failed to load model details.</div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ranking Performance Over Time</h2>
          <p className="text-sm text-gray-600 mb-6">
            Monthly ELO score evolution across all challenges, individual challenge definitions, and frequency/horizon combinations.
          </p>
          {loading ? (
            <div className="text-center">
              <div className="text-lg text-gray-600">Loading rankings...</div>
            </div>
          ) : rankingsData ? (
            <ModelPerformanceCharts definitionRankings={rankingsData.definition_rankings} />
          ) : (
            <div className="text-center">
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
