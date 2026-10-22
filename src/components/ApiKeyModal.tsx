import React, { useState } from 'react';
import { Key, X, Save, AlertCircle } from 'lucide-react';
import { getApiKey, setApiKey } from '../agent/llmClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [keyInput, setKeyInput] = useState<string>(getApiKey() || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(keyInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSaved();
      onClose();
    }, 600);
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-card modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3>Cấu hình Google AI Studio API Key</h3>
          </div>
          <button onClick={onClose} className="icon-btn danger text-sm" title="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          <p className="text-sm text-gray-300 mb-3">
            Web app chạy 100% trên trình duyệt và tự gọi API của model{' '}
            <strong className="text-indigo-300">gemma-4-26b-a4b-it</strong>. API Key sẽ được lưu an toàn
            trong <code>localStorage</code> của trình duyệt.
          </p>

          <div className="input-group">
            <label htmlFor="apiKeyInput">Google Gemini / Gemma API Key:</label>
            <input
              id="apiKeyInput"
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="key-input"
              required
            />
          </div>

          <div className="modal-note">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Chưa có API Key? Bạn có thể lấy miễn phí tại{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300"
              >
                Google AI Studio
              </a>
              .
            </span>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => {
                setKeyInput('');
                setApiKey('');
              }}
              className="btn-secondary"
            >
              Xóa Key
            </button>
            <button type="submit" className="btn-primary">
              <Save className="w-4 h-4" />
              {savedSuccess ? 'Đã lưu!' : 'Lưu API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

