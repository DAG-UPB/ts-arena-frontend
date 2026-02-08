'use client';

import type { Challenge } from '@/src/types/challenge';

interface ChallengeListProps {
  challenges: Challenge[];
  selectedChallengeId?: number;
  onSelectChallenge: (challengeId: number) => void;
}

export default function ChallengeList({ 
  challenges, 
  selectedChallengeId, 
  onSelectChallenge
}: ChallengeListProps) {

  return (
    <div className="space-y-4">
      {/* Challenge List */}
      <div className="grid gap-3">
        {challenges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No challenges found matching your filters.
          </div>
        ) : (
          challenges.map((challenge) => (
            <button
              key={challenge.challenge_id}
              onClick={() => onSelectChallenge(challenge.challenge_id)}
              className={`w-full text-left p-4 border rounded-lg transition-all ${
                selectedChallengeId === challenge.challenge_id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{challenge.name || `Challenge ${challenge.challenge_id}`}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    challenge.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {challenge.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>ID: {challenge.challenge_id}</p>
                {challenge.description && <p className="italic">{challenge.description}</p>}
                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                  {challenge.start_time && (
                    <span>Start: {new Date(challenge.start_time).toLocaleDateString()}</span>
                  )}
                  {challenge.end_time && (
                    <span>End: {new Date(challenge.end_time).toLocaleDateString()}</span>
                  )}
                  <span>Series: {challenge.n_time_series}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
