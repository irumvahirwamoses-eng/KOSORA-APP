import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCamera, FiUpload, FiCheck, FiX, FiImage, FiVideo, FiDownload } from 'react-icons/fi';

const Scanning = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => { fetch(); }, [selectedExam]);

  useEffect(() => {
    return () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); } };
  }, []);

  const fetch = async () => {
    try {
      const [e, s] = await Promise.all([api.get('/api/exams?limit=100'), api.get('/api/students?limit=500')]);
      setExams(e.data.exams || []);
      setStudents(s.data.students || []);
      if (selectedExam) { const r = await api.get(`/api/scanner/${selectedExam}/scans`); setScans(r.data.scans || []); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)); setScanResult(null); setBatchResults([]); }
  };

  const handleMultipleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setBatchResults([]);
    if (selected.length > 0) setPreview(URL.createObjectURL(selected[0]));
  };

  const startWebcam = async () => {
    try {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCameraActive(true);
    } catch { toast.error('Cannot access webcam. Allow camera permission.'); }
  };

  const stopWebcam = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setScanResult(null);
      setBatchResults([]);
    });
    stopWebcam();
  };

  const processSingle = async () => {
    if (!selectedExam || !selectedStudent || !imageFile) return toast.error('Select exam, student, and upload image');
    setProcessing(true);
    const fd = new FormData();
    fd.append('scan', imageFile);
    fd.append('studentId', selectedStudent);
    try {
      const res = await api.post(`/api/scanner/${selectedExam}/process`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScanResult(res.data);
      toast.success('Scan processed');
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Scanner unavailable'); }
    finally { setProcessing(false); }
  };

  const processBatch = async () => {
    if (!selectedExam || files.length === 0) return toast.error('Select exam and upload at least one sheet');
    setProcessing(true);
    setBatchResults([]);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('scan', files[i]);
      fd.append('studentId', selectedStudent || '');
      try {
        const res = await api.post(`/api/scanner/${selectedExam}/process`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        results.push({ file: files[i].name, success: true, data: res.data });
        toast.success(`Sheet ${i + 1}/${files.length} done`);
      } catch (err) {
        results.push({ file: files[i].name, success: false, error: err.response?.data?.error || 'Failed' });
        toast.error(`Sheet ${i + 1}/${files.length} failed`);
      }
    }
    setBatchResults(results);
    toast.success(`Processed ${results.filter(r => r.success).length}/${files.length} sheets`);
    setProcessing(false);
    fetch();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">OMR Scanner</h2>

      <div className="flex gap-2 mb-2">
        <button onClick={() => { setBatchMode(false); setBatchResults([]); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${!batchMode ? 'bg-kosora-600 text-white' : 'bg-gray-100'}`}><FiCamera className="w-4 h-4 inline mr-1" />Single Scan</button>
        <button onClick={() => { setBatchMode(true); setScanResult(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${batchMode ? 'bg-kosora-600 text-white' : 'bg-gray-100'}`}><FiUpload className="w-4 h-4 inline mr-1" />Batch Scan</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">{batchMode ? 'Batch Scan OMR Sheets' : 'Scan OMR Sheet'}</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <select required className="px-3 py-2 border rounded-lg" value={selectedExam} onChange={(e) => { setSelectedExam(e.target.value); setSelectedStudent(''); }}>
                <option value="">Select Exam</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
              <select required={!batchMode} className="px-3 py-2 border rounded-lg" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">{batchMode ? 'Student (optional)' : 'Select Student'}</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {!batchMode && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Image</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" id="scan-file" />
                    <label htmlFor="scan-file" className="cursor-pointer">
                      <FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload</p>
                    </label>
                  </div>
                </div>
                <button type="button" onClick={cameraActive ? stopWebcam : startWebcam}
                  className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${cameraActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <FiCamera className="w-4 h-4" /> {cameraActive ? 'Stop Camera' : 'Use Webcam'}
                </button>

                {cameraActive && (
                  <div className="space-y-2">
                    <video ref={videoRef} className="w-full rounded-lg border bg-black" autoPlay playsInline />
                    <button type="button" onClick={takePhoto} className="w-full bg-kosora-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                      <FiVideo className="w-4 h-4" /> Capture Photo
                    </button>
                  </div>
                )}

                {preview && !cameraActive && (
                  <img src={preview} alt="Preview" className="w-full rounded-lg border max-h-72 object-contain" />
                )}

                <button type="button" onClick={processSingle} disabled={processing || !imageFile}
                  className="w-full bg-kosora-600 text-white py-3 rounded-lg hover:bg-kosora-700 disabled:opacity-50">
                  {processing ? 'Processing...' : 'Process OMR Sheet'}
                </button>
              </>
            )}

            {batchMode && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Multiple Sheets</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input type="file" accept="image/*" multiple onChange={handleMultipleFiles} className="hidden" id="batch-files" />
                    <label htmlFor="batch-files" className="cursor-pointer">
                      <FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Select multiple images</p>
                    </label>
                  </div>
                </div>

                {files.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{files.length} file(s) selected</p>
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span className="truncate"><FiImage className="w-4 h-4 inline mr-1 text-gray-400" />{f.name}</span>
                          <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {preview && <img src={preview} alt="Preview" className="w-full rounded-lg border max-h-48 object-contain" />}

                <button type="button" onClick={processBatch} disabled={processing || files.length === 0}
                  className="w-full bg-kosora-600 text-white py-3 rounded-lg hover:bg-kosora-700 disabled:opacity-50">
                  {processing ? `Processing ${files.length} sheets...` : `Process All (${files.length})`}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {!batchMode && scanResult && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Scan Result</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-kosora-600">{scanResult.score}/{scanResult.totalMarks}</p>
                <p className="text-2xl font-semibold mt-1">{scanResult.percentage?.toFixed(1)}%</p>
                <span className={`mt-2 inline-block px-4 py-2 rounded-full text-sm font-medium ${scanResult.percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>Grade: {scanResult.grade}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded"><FiCheck className="text-green-500" /> Correct: {scanResult.correctCount}</div>
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded"><FiX className="text-red-500" /> Wrong: {scanResult.totalQuestions - scanResult.correctCount}</div>
              </div>
            </div>
          )}

          {batchMode && batchResults.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Batch Results ({batchResults.filter(r => r.success).length}/{batchResults.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {batchResults.map((r, i) => (
                  <div key={i} className={`p-3 rounded-lg ${r.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium truncate">{r.file}</p>
                      {r.success ? (
                        <span className="text-green-700 font-medium text-sm">{r.data.score}/{r.data.totalMarks}</span>
                      ) : (
                        <span className="text-red-600 text-xs">{r.error}</span>
                      )}
                    </div>
                    {r.success && (
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span className="text-green-600">✓ {r.data.correctCount} correct</span>
                        <span className="text-red-600">✗ {r.data.totalQuestions - r.data.correctCount} wrong</span>
                        <span>{r.data.percentage?.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <p className="text-lg font-semibold">
                  Passed: {batchResults.filter(r => r.success && r.data.percentage >= 50).length} / 
                  Failed: {batchResults.filter(r => r.success && r.data.percentage < 50).length}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Scan History</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scans.map(s => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{s.student_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {s.status === 'processed' ? (
                      <><p className="font-medium text-sm">{s.score}/{s.total_marks}</p><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Done</span></>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">{s.status}</span>
                    )}
                  </div>
                </div>
              ))}
              {scans.length === 0 && <p className="text-gray-500 text-center py-8">No scans yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanning;
