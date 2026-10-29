import api from './index';
import { fetchAllPages } from './production';

const mapCrewMember = (member) => ({
  ...member,
  name: member.full_name ?? member.name ?? '',
  role: member.role ?? '',
  dailyRate: member.daily_rate ?? member.dailyRate,
  available: member.is_available ?? member.available,
});

export const fetchCrew = async ({ search, department } = {}) => {
  let results = (await fetchAllPages('/production/crew/')).map(mapCrewMember);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter((c) => c.name.toLowerCase().includes(q));
  }
  if (department) results = results.filter((c) => c.department === department);
  return { count: results.length, results };
};

export const fetchCrewMember = async (id) => {
  const { data } = await api.get(`/production/crew/${id}/`);
  return mapCrewMember(data);
};

export const createCrewMember = async (crewMember) => {
  const { data } = await api.post('/production/crew/', {
    full_name: crewMember.name,
    role: crewMember.role,
    department: crewMember.department,
    daily_rate: Number(crewMember.dailyRate),
    is_available: true,
    skills: [],
  });
  return mapCrewMember(data);
};

export const updateCrewAvailability = async (id, available) => {
  const { data } = await api.patch(`/production/crew/${id}/`, {
    is_available: available,
  });
  return mapCrewMember(data);
};

export const deleteCrewMember = async (id) => {
  await api.delete(`/production/crew/${id}/`);
};
