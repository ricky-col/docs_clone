import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import API from '../services/api';

const InviteHandler = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleAcceptInvite = async () => {
    try {
      await API.post(`/documents/${id}/join/${token}`);
      // If successful (or already a collaborator), navigate to the document
      navigate(`/documents/${id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join document. The invite link might be invalid or expired.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invite Link Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md max-w-md w-full p-8 text-center">
        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Collaboration Invite</h2>
        <p className="text-gray-600 mb-8">
          You have been invited to collaborate on a document. Click below to accept the invitation and join the workspace.
        </p>
        <button
          onClick={handleAcceptInvite}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Accept Invitation
        </button>
        <div className="mt-4">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            Decline and return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InviteHandler;
