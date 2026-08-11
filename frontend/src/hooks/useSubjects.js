import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Shared hook to fetch all subjects (with their embedded topics).
 * Provides helpers to create new subjects and topics inline.
 */
export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.subjects || []);
    } catch {
      // silently fail — subjects are optional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const createSubject = async (name) => {
    const { data } = await api.post('/subjects', { name });
    const newSubject = data.subject;
    setSubjects(prev => [...prev, newSubject].sort((a, b) => a.name.localeCompare(b.name)));
    return newSubject;
  };

  const createTopic = async (subjectId, name) => {
    const { data } = await api.post(`/subjects/${subjectId}/topics`, { name });
    const updatedSubject = data.subject;
    setSubjects(prev => prev.map(s => s._id === subjectId ? updatedSubject : s));
    return updatedSubject;
  };

  const getTopicsForSubject = (subjectId) => {
    if (!subjectId) return [];
    const subject = subjects.find(s => s._id === subjectId);
    return subject ? subject.topics : [];
  };

  return { subjects, loading, fetchSubjects, createSubject, createTopic, getTopicsForSubject };
}
