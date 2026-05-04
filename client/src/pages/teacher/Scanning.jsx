import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCamera, FiUpload, FiCheck, FiX } from 'react-icons/fi';

const Scanning = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => { fetch(); }, [selectedExam]);

  const fetch = async () => {
    try {
      const [e, s] = await Promise.all([api.get('/api/exams?limit=100'), api.get('/api/students?limit=500')]);
      setExams(e.data.exams || []);
      setStudents(s.data.students || []);
      if (selectedExam) { const r = await api.get(`/api/scanner/${selectedExam}/scans`); setScans(r.data.scans || []); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)); setScanResult(null); } };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.style.display = 'block'; }
    } catch { toast.error('Cannot access webcam'); }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      setImageFile(file); setPreview(URL.createObjectURL(file)); setScanResult(null);
    });
    video.srcObject.getTracks().forEach(t => t.stop());
    video.style.display = 'none';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExam || !selectedStudent || !imageFile) return toast.error('Fill all fields and upload an image');
    setProcessing(true);
    const fd = new FormData();
    fd.append('scan', imageFile);
    fd.append('studentId', selectedStudent);
    try {
      const res = await api.post(`/api/scanner/${selectedExam}/process`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScanResult(res.data);
      toast.success('Processed');
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Scanner service unavailable'); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">OMR Scanner</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Upload OMR Sheet</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <select required className="px-3 py-2 border rounded-lg" value={selectedExam} onChange={(e) => { setSelectedExam(e.target.value); setSelectedStudent(''); }}><option value="">Select Exam</option>{exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}</select>
              <select required className="px-3 py-2 border rounded-lg" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}><option value="">Select Student</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Upload Image</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" id="scan-file" />
                <label htmlFor="scan-file" className="cursor-pointer"><FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" /><p className="text-sm text-gray-500">Click to upload</p></label>
              </div>
            </div>
            <button type="button" onClick={startWebcam} className="w-full bg-gray-100 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200"><FiCamera className="w-4 h-4" /> Use Webcam</button>
            {preview && <img src={preview} alt="Preview" className="w-full rounded-lg border max-h-64 object-contain" />}
            <video ref={videoRef} className="w-full mt-2 rounded-lg hidden" autoPlay playsInline />
            {videoRef.current?.srcObject && <button type="button" onClick={takePhoto} className="w-full bg-kosora-600 text-white py-2 rounded-lg mt-2">Capture</button>}
            <button type="submit" disabled={processing} className="w-full bg-kosora-600 text-white py-3 rounded-lg hover:bg-kosora-700 disabled:opacity-50">{processing ? 'Processing...' : 'Process OMR Sheet'}</button>
          </form>
        </div>

        <div className="space-y-6">
          {scanResult && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Result</h3>
              <div className="text-center"><p className="text-4xl font-bold text-kosora-600">{scanResult.score}/{scanResult.totalMarks}</p><p className="text-2xl font-semibold mt-1">{scanResult.percentage?.toFixed(1)}%</p><span className={`mt-2 inline-block px-4 py-2 rounded-full text-sm font-medium ${scanResult.percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>Grade: {scanResult.grade}</span></div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><FiCheck className="text-green-500" /> Correct: {scanResult.correctCount}</div>
                <div className="flex items-center gap-2"><FiX className="text-red-500" /> Wrong: {scanResult.totalQuestions - scanResult.correctCount}</div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Scan History</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scans.map(s => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div><p className="font-medium text-sm">{s.student_name || 'Unknown'}</p><p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString()}</p></div>
                  <div className="text-right">{s.status === 'processed' ? <><p className="font-medium text-sm">{s.score}/{s.total_marks}</p><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Done</span></> : <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">{s.status}</span>}</div>
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
