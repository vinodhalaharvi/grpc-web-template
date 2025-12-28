import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCAs, useIssueCertificate } from '../hooks/useApi';
import { KeyAlgorithm } from '../types';
import { ArrowLeft, Plus, X, FileKey } from 'lucide-react';

export default function IssueCertificate() {
  const navigate = useNavigate();
  const { data: casData } = useCAs();
  const issueMutation = useIssueCertificate();

  const [formData, setFormData] = useState({
    caId: '',
    commonName: '',
    san: [] as string[],
    validityDays: 365,
    keyAlgorithm: KeyAlgorithm.RSA,
    keySize: 2048,
  });
  const [sanInput, setSanInput] = useState('');

  const handleAddSan = () => {
    if (sanInput && !formData.san.includes(sanInput)) {
      setFormData({ ...formData, san: [...formData.san, sanInput] });
      setSanInput('');
    }
  };

  const handleRemoveSan = (san: string) => {
    setFormData({ ...formData, san: formData.san.filter((s) => s !== san) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cert = await issueMutation.mutateAsync(formData);
      navigate(`/certificates/${cert.certId}`);
    } catch (error) {
      // Handle error
    }
  };

  const cas = casData?.cas || [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/certificates"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issue Certificate</h1>
          <p className="text-slate-500 mt-1">
            Create a new SSL/TLS certificate
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CA Selection */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Certificate Authority
          </h2>
          <div>
            <label className="label">Select CA</label>
            <select
              value={formData.caId}
              onChange={(e) => setFormData({ ...formData, caId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a Certificate Authority</option>
              {cas.map((ca) => (
                <option key={ca.caId} value={ca.caId}>
                  {ca.name}
                </option>
              ))}
            </select>
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
                value={formData.commonName}
                onChange={(e) =>
                  setFormData({ ...formData, commonName: e.target.value })
                }
                className="input"
                placeholder="example.com"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                The primary domain name for this certificate
              </p>
            </div>

            {/* SANs */}
            <div>
              <label className="label">Subject Alternative Names (SANs)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sanInput}
                  onChange={(e) => setSanInput(e.target.value)}
                  className="input flex-1"
                  placeholder="*.example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSan();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSan}
                  className="btn btn-secondary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.san.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.san.map((san) => (
                    <span
                      key={san}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm"
                    >
                      {san}
                      <button
                        type="button"
                        onClick={() => handleRemoveSan(san)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                <option value={KeyAlgorithm.ED25519}>Ed25519</option>
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
                    <option value={4096}>4096 bits</option>
                  </>
                ) : formData.keyAlgorithm === KeyAlgorithm.ECDSA ? (
                  <>
                    <option value={256}>P-256</option>
                    <option value={384}>P-384</option>
                    <option value={521}>P-521</option>
                  </>
                ) : (
                  <option value={256}>256 bits</option>
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
              value={formData.validityDays}
              onChange={(e) =>
                setFormData({ ...formData, validityDays: parseInt(e.target.value) })
              }
              className="input"
            >
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
              <option value={730}>2 years</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/certificates" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={issueMutation.isPending}
            className="btn btn-primary"
          >
            {issueMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FileKey className="w-4 h-4" />
                Issue Certificate
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
