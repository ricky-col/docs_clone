import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import API from '../services/api';

const InviteHandler = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const joinDocument = async () => {
      try {
        await API.post(`/documents/${id}/join/${token}`);
        // If successful (or already a collaborator), navigate to the document
        navigate(`/documents/${id}`, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join document. The invite link might be invalid or expired.');
      }
    };

    joinDocument();
  }, [id, token, navigate]);

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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
      <p className="text-gray-600 font-medium">Joining document...</p>
    </div>
  );
};

export default InviteHandler;
