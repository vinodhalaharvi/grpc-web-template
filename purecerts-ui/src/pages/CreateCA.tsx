import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateCA } from '../hooks/useApi';
import { CAType, KeyAlgorithm } from '../types';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function CreateCA() {
  const navigate = useNavigate();
  const createMutation = useCreateCA();

  const [formData, setFormData] = useState({
    name: '',
    type: CAType.ROOT,
    subject: {
      commonName: '',
      organization: '',
      country: '',
    },
    keyAlgorithm: KeyAlgorithm.RSA,
    keySize: 4096,
    validityYears: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ca = await createMutation.mutateAsync(formData);
      navigate(`/cas/${ca.caId}`);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/cas"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Certificate Authority
          </h1>
          <p className="text-slate-500 mt-1">
            Set up a new root or intermediate CA
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">CA Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
                placeholder="My Root CA"
                required
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: parseInt(e.target.value) as CAType,
                  })
                }
                className="input"
              >
                <option value={CAType.ROOT}>Root CA</option>
                <option value={CAType.INTERMEDIATE}>Intermediate CA</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Subject</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Common Name (CN) *</label>
              <input
                type="text"
                value={formData.subject.commonName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subject: { ...formData.subject, commonName: e.target.value },
                  })
                }
                className="input"
                placeholder="My Root CA"
                required
              />
            </div>
            <div>
              <label className="label">Organization (O)</label>
              <input
                type="text"
                value={formData.subject.organization}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subject: { ...formData.subject, organization: e.target.value },
                  })
                }
                className="input"
                placeholder="My Company Inc."
              />
            </div>
            <div>
              <label className="label">Country (C)</label>
              <input
                type="text"
                value={formData.subject.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subject: { ...formData.subject, country: e.target.value },
                  })
                }
                className="input"
                placeholder="US"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* Key Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Key Settings
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Algorithm</label>
              <select
                value={formData.keyAlgorithm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keyAlgorithm: parseInt(e.target.value) as KeyAlgorithm,
                  })
                }
                className="input"
              >
                <option value={KeyAlgorithm.RSA}>RSA</option>
                <option value={KeyAlgorithm.ECDSA}>ECDSA</option>
              </select>
            </div>
            <div>
              <label className="label">Key Size</label>
              <select
                value={formData.keySize}
                onChange={(e) =>
                  setFormData({ ...formData, keySize: parseInt(e.target.value) })
                }
                className="input"
              >
                {formData.keyAlgorithm === KeyAlgorithm.RSA ? (
                  <>
                    <option value={2048}>2048 bits</option>
                    <option value={4096}>4096 bits (Recommended)</option>
                  </>
                ) : (
                  <>
                    <option value={256}>P-256</option>
                    <option value={384}>P-384 (Recommended)</option>
                    <option value={521}>P-521</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Validity</h2>
          <div>
            <label className="label">Validity Period</label>
            <select
              value={formData.validityYears}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  validityYears: parseInt(e.target.value),
                })
              }
              className="input"
            >
              <option value={5}>5 years</option>
              <option value={10}>10 years (Recommended)</option>
              <option value={20}>20 years</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/cas" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn btn-primary"
          >
            {createMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                Create CA
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
