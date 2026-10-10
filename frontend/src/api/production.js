import api from './index';

const rows = (data) => (Array.isArray(data) ? data : data.results || []);

export const fetchAllPages = async (path) => {
  const results = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const { data } = await api.get(path, { params: { page, page_size: 100 } });
    results.push(...rows(data));
    hasNextPage = !Array.isArray(data) && Boolean(data.next);
    page += 1;
  }

  return results;
};

const mapCastMember = (actor) => ({
  ...actor,
  name: actor.full_name ?? actor.name ?? '',
  character: actor.character_name ?? actor.character ?? '',
  age: actor.physical_attributes?.age ?? actor.age ?? '',
  skills: actor.special_skills ?? actor.skills ?? [],
});

const mapScene = (scene) => {
  const statusMap = {
    Pending: 'Not Started',
    Ready: 'Cut',
    In_Progress: 'In Progress',
    Completed: 'Shot',
  };

  return {
    ...scene,
    number: scene.scene_number ?? scene.number ?? 0,
    title: scene.notes ?? scene.title ?? '',
    location: scene.location ?? '',
    timeOfDay: scene.time_of_day ?? scene.timeOfDay ?? '',
    status: statusMap[scene.status] ?? scene.status ?? 'Not Started',
    tags: scene.tags ?? [],
  };
};

const mapTransaction = (transaction) => ({
  ...transaction,
  date: transaction.transaction_date ?? transaction.date ?? '',
  amount: Number(transaction.amount) || 0,
});

const mapEquipment = (equipment) => ({
  ...equipment,
  name: equipment.name ?? '',
  category: equipment.category ?? '',
  serial: equipment.serial_number ?? equipment.serial ?? '',
  status: equipment.status ?? (equipment.is_available === false ? 'In Use' : 'Available'),
});

const mapFilmAsset = (asset) => ({
  ...asset,
  title: asset.title ?? '',
  category: asset.category ?? '',
  image: asset.image ?? '',
});

export const fetchCast = async () => {
  return (await fetchAllPages('/production/cast/')).map(mapCastMember);
};

export const createCastMember = async ({ name, character, age }) => {
  const { data } = await api.post('/production/cast/', {
    full_name: name,
    character_name: character,
    physical_attributes: { age: Number(age) },
    special_skills: [],
    is_available: true,
  });
  return mapCastMember(data);
};

export const fetchScenes = async () => {
  return (await fetchAllPages('/production/scenes/')).map(mapScene);
};

export const createShootDay = async ({ projectId, shootDate, dayNumber, location }) => {
  const { data } = await api.post('/production/shoot-days/', {
    project: projectId || null,
    shoot_date: shootDate,
    day_number: dayNumber,
    location,
  });
  return data;
};

export const updateShootDay = async ({ id, projectId, shootDate, dayNumber, location }) => {
  const { data } = await api.patch(`/production/shoot-days/${id}/`, {
    project: projectId || null,
    shoot_date: shootDate,
    day_number: dayNumber,
    location,
  });
  return data;
};

export const deleteShootDay = async (id) => {
  await api.delete(`/production/shoot-days/${id}/`);
};

export const updateProjectDeadline = async ({ id, endDate }) => {
  const { data } = await api.patch(`/production/projects/${id}/`, {
    end_date: endDate,
  });
  return data;
};

export const createScene = async ({ number, title, location, timeOfDay, status }) => {
  const statusMap = {
    'Not Started': 'Pending',
    'In Progress': 'In_Progress',
    Shot: 'Completed',
    Cut: 'Ready',
  };
  const { data } = await api.post('/production/scenes/', {
    scene_number: number,
    notes: title,
    location,
    time_of_day: timeOfDay,
    status: statusMap[status] ?? status,
  });
  return mapScene(data);
};

export const updateScene = async ({ id, number, title, location, timeOfDay, status }) => {
  const statusMap = {
    'Not Started': 'Pending',
    'In Progress': 'In_Progress',
    Shot: 'Completed',
    Cut: 'Ready',
  };
  const { data } = await api.patch(`/production/scenes/${id}/`, {
    scene_number: number,
    notes: title,
    location,
    time_of_day: timeOfDay,
    status: statusMap[status] ?? status,
  });
  return mapScene(data);
};

export const updateSceneStatus = async (scene, status) => {
  const statusMap = {
    'Not Started': 'Pending',
    'In Progress': 'In_Progress',
    Shot: 'Completed',
    Cut: 'Ready',
  };
  const { data } = await api.patch(`/production/scenes/${scene.id}/`, {
    status: statusMap[status] ?? status,
  });
  return mapScene(data);
};

export const fetchBudgetTransactions = async () => {
  return (await fetchAllPages('/production/budget/')).map(mapTransaction);
};

export const createBudgetTransaction = async ({ description, category, amount, date }) => {
  const { data } = await api.post('/production/budget/', {
    description,
    category,
    amount,
    transaction_date: date,
  });
  return mapTransaction(data);
};

export const updateBudgetTransaction = async ({ id, description, category, amount, date }) => {
  const { data } = await api.patch(`/production/budget/${id}/`, {
    description,
    category,
    amount,
    transaction_date: date,
  });
  return mapTransaction(data);
};

export const fetchEquipment = async () => {
  return (await fetchAllPages('/production/equipment/')).map(mapEquipment);
};

export const createEquipment = async ({ name, category, serial }) => {
  const { data } = await api.post('/production/equipment/', {
    name,
    category,
    serial_number: serial,
    condition_status: 'Good',
    is_available: true,
  });
  return mapEquipment(data);
};

export const fetchFilmAssets = async () => {
  return (await fetchAllPages('/production/film-assets/')).map(mapFilmAsset);
};

export const createFilmAsset = async ({ title, category, image }) => {
  if (USE_MOCK) {
    const { data } = await api.post('/production/film-assets/', { title, category, image: '' });
    return mapFilmAsset(data);
  }
  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('image', image);
  const { data } = await api.post('/production/film-assets/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapFilmAsset(data);
};
