-- ============================================================
-- CHUTTEE FILM PRODUCTION DATABASE
-- Target: PostgreSQL 12+
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
-- 1. FILM PROJECTS (Master Table with JSONB)
-- ============================================================
DROP TABLE IF EXISTS film_projects CASCADE;
CREATE TABLE film_projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    director VARCHAR(100) NOT NULL,
    logline TEXT,
    genre VARCHAR(50),
    duration_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'Development',
    total_budget DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'INR',
    start_date DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN (
        'Development', 'Pre-Production', 'Production',
        'Post-Production', 'Completed', 'Festival_Run'
    ))
);

-- ============================================================
-- 2. CREW MEMBERS
-- ============================================================
DROP TABLE IF EXISTS crew_members CASCADE;
CREATE TABLE crew_members (
    crew_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    experience_years DECIMAL(3,1),
    email VARCHAR(100),
    phone VARCHAR(20),
    daily_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT TRUE,
    joined_date DATE,
    skills TEXT[] DEFAULT '{}',
    emergency_contact JSONB,
    certifications JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. CAST MEMBERS
-- ============================================================
DROP TABLE IF EXISTS cast_members CASCADE;
CREATE TABLE cast_members (
    cast_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    character_name VARCHAR(100),
    role_type VARCHAR(20) DEFAULT 'Supporting',
    experience_years DECIMAL(3,1),
    email VARCHAR(100),
    phone VARCHAR(20),
    daily_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT TRUE,
    joined_date DATE,
    physical_attributes JSONB,
    special_skills TEXT[] DEFAULT '{}',
    representation JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_role_type CHECK (role_type IN ('Lead', 'Supporting', 'Cameo', 'Extra'))
);

-- ============================================================
-- 4. SCENES
-- ============================================================
DROP TABLE IF EXISTS scenes CASCADE;
CREATE TABLE scenes (
    scene_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    location VARCHAR(100),
    time_of_day VARCHAR(20) DEFAULT 'Morning',
    complexity_score DECIMAL(3,2) DEFAULT 0.5,
    emotional_tone VARCHAR(50),
    duration_estimate_minutes INTEGER,
    is_indoor BOOLEAN DEFAULT TRUE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    props JSONB DEFAULT '[]'::jsonb,
    wardrobe JSONB DEFAULT '[]'::jsonb,
    lighting_notes TEXT,
    sound_notes TEXT,
    camera_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_time_of_day CHECK (time_of_day IN ('Morning', 'Afternoon', 'Evening', 'Night')),
    CONSTRAINT valid_complexity CHECK (complexity_score BETWEEN 0 AND 1),
    CONSTRAINT valid_status CHECK (status IN ('Pending', 'Ready', 'In_Progress', 'Completed')),
    UNIQUE(project_id, scene_number)
);

-- ============================================================
-- 5. SCENE-ACTOR MAPPING
-- ============================================================
DROP TABLE IF EXISTS scene_actors CASCADE;
CREATE TABLE scene_actors (
    scene_id UUID REFERENCES scenes(scene_id) ON DELETE CASCADE,
    cast_id UUID REFERENCES cast_members(cast_id) ON DELETE CASCADE,
    lines_count INTEGER DEFAULT 0,
    screen_time_minutes INTEGER DEFAULT 0,
    rehearsal_hours DECIMAL(4,2) DEFAULT 0,
    performance_notes TEXT,
    is_stand_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (scene_id, cast_id)
);

-- ============================================================
-- 6. EQUIPMENT
-- ============================================================
DROP TABLE IF EXISTS equipment CASCADE;
CREATE TABLE equipment (
    equipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    brand VARCHAR(50),
    model VARCHAR(50),
    serial_number VARCHAR(50) UNIQUE,
    condition_status VARCHAR(20) DEFAULT 'Good',
    daily_rental_cost DECIMAL(10,2),
    purchased_date DATE,
    last_maintenance DATE,
    is_available BOOLEAN DEFAULT TRUE,
    specifications JSONB DEFAULT '{}'::jsonb,
    maintenance_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_condition CHECK (condition_status IN ('Excellent', 'Good', 'Fair', 'Poor'))
);

-- ============================================================
-- 7. EQUIPMENT USAGE LOG
-- ============================================================
DROP TABLE IF EXISTS equipment_usage CASCADE;
CREATE TABLE equipment_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    scene_id UUID REFERENCES scenes(scene_id) ON DELETE CASCADE,
    used_date DATE NOT NULL,
    hours_used DECIMAL(5,2),
    condition_after VARCHAR(20) DEFAULT 'Good',
    notes TEXT,
    issues TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. SHOOT DAYS
-- ============================================================
DROP TABLE IF EXISTS shoot_days CASCADE;
CREATE TABLE shoot_days (
    shoot_day_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    shoot_date DATE NOT NULL,
    day_number INTEGER,
    location VARCHAR(100),
    weather_condition VARCHAR(50),
    temperature_celsius DECIMAL(4,1),
    is_rained BOOLEAN DEFAULT FALSE,
    crew_present INTEGER,
    cast_present INTEGER,
    start_time TIME,
    end_time TIME,
    total_hours DECIMAL(4,2),
    status VARCHAR(20) DEFAULT 'Scheduled',
    notes TEXT,
    weather_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('Scheduled', 'In_Progress', 'Completed', 'Cancelled', 'Rescheduled')),
    UNIQUE(project_id, day_number)
);

-- ============================================================
-- 9. SHOOT DAY - SCENE MAPPING
-- ============================================================
DROP TABLE IF EXISTS shoot_day_scenes CASCADE;
CREATE TABLE shoot_day_scenes (
    shoot_day_id UUID REFERENCES shoot_days(shoot_day_id) ON DELETE CASCADE,
    scene_id UUID REFERENCES scenes(scene_id) ON DELETE CASCADE,
    shot_order INTEGER,
    status VARCHAR(20) DEFAULT 'Pending',
    actual_time_taken_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (shoot_day_id, scene_id),
    CONSTRAINT valid_status CHECK (status IN ('Pending', 'In_Progress', 'Completed', 'Reshoot'))
);

-- ============================================================
-- 10. BUDGET TRANSACTIONS
-- ============================================================
DROP TABLE IF EXISTS budget_transactions CASCADE;
CREATE TABLE budget_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    vendor_name VARCHAR(100),
    receipt_number VARCHAR(50),
    approved_by VARCHAR(100),
    payment_method VARCHAR(50),
    invoice_number VARCHAR(50),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_category CHECK (category IN (
        'Crew', 'Cast', 'Equipment', 'Location', 'Post_Production',
        'Marketing', 'Miscellaneous', 'Travel', 'Insurance', 'Legal'
    ))
);

-- ============================================================
-- 11. SCRIPT DIALOGUES
-- ============================================================
DROP TABLE IF EXISTS script_dialogues CASCADE;
CREATE TABLE script_dialogues (
    dialogue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    scene_id UUID REFERENCES scenes(scene_id) ON DELETE CASCADE,
    character_name VARCHAR(100),
    dialogue_text TEXT NOT NULL,
    dialogue_order INTEGER,
    emotion_tag VARCHAR(50),
    intensity_score DECIMAL(3,2),
    tone_category VARCHAR(50),
    has_conflict BOOLEAN DEFAULT FALSE,
    has_romance BOOLEAN DEFAULT FALSE,
    word_count INTEGER,
    speech_duration_seconds INTEGER,
    context_notes TEXT,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. SENTIMENT ANALYSIS RESULTS
-- ============================================================
DROP TABLE IF EXISTS sentiment_analysis CASCADE;
CREATE TABLE sentiment_analysis (
    sentiment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    scene_id UUID REFERENCES scenes(scene_id) ON DELETE CASCADE,
    dialogue_id UUID REFERENCES script_dialogues(dialogue_id) ON DELETE CASCADE,
    polarity DECIMAL(5,4),
    subjectivity DECIMAL(5,4),
    emotion_label VARCHAR(50),
    confidence DECIMAL(5,4),
    aspect_sentiments JSONB DEFAULT '{}'::jsonb,
    analyzed_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. PRODUCTION RISKS
-- ============================================================
DROP TABLE IF EXISTS production_risks CASCADE;
CREATE TABLE production_risks (
    risk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    risk_date DATE NOT NULL,
    risk_type VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'Medium',
    probability DECIMAL(3,2),
    impact DECIMAL(3,2),
    risk_score DECIMAL(7,2) GENERATED ALWAYS AS (
        COALESCE(probability, 0) * COALESCE(impact, 0) * 100
    ) STORED,
    mitigation_plan TEXT,
    owner VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Identified',
    resolved_date DATE,
    category VARCHAR(50),
    triggers TEXT[] DEFAULT '{}',
    mitigation_steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_severity CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    CONSTRAINT valid_status CHECK (status IN ('Identified', 'Mitigating', 'Resolved', 'Escalated', 'Closed')),
    CONSTRAINT valid_risk_type CHECK (risk_type IN (
        'Weather', 'Budget', 'Schedule', 'Technical',
        'Human Resources', 'Legal', 'Security', 'Health'
    ))
);

-- ============================================================
-- 14. FESTIVAL SUBMISSIONS
-- ============================================================
DROP TABLE IF EXISTS festival_submissions CASCADE;
CREATE TABLE festival_submissions (
    submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    festival_name VARCHAR(100) NOT NULL,
    festival_category VARCHAR(50),
    submission_date DATE,
    submission_fee DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'Pending',
    award_name VARCHAR(100),
    award_category VARCHAR(50),
    selection_probability DECIMAL(3,2),
    notes TEXT,
    festival_metadata JSONB DEFAULT '{}'::jsonb,
    submission_documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('Pending', 'Submitted', 'Selected', 'Rejected', 'Awarded'))
);

-- ============================================================
-- 15. ANALYTICS DAILY
-- ============================================================
DROP TABLE IF EXISTS analytics_daily CASCADE;
CREATE TABLE analytics_daily (
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    daily_budget_spent DECIMAL(12,2),
    cumulative_budget_spent DECIMAL(12,2),
    scenes_completed_today INTEGER,
    cumulative_scenes_completed INTEGER,
    average_takes_today DECIMAL(4,2),
    crew_attendance_rate DECIMAL(5,2),
    equipment_uptime_percentage DECIMAL(5,2),
    sentiment_score_today DECIMAL(3,2),
    risk_score_today DECIMAL(3,2),
    productivity_score DECIMAL(3,2),
    key_metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_id, date)
);

-- ============================================================
-- 16. ML PREDICTIONS STORAGE
-- ============================================================
DROP TABLE IF EXISTS ml_predictions CASCADE;
CREATE TABLE ml_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES film_projects(project_id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    prediction_data JSONB NOT NULL,
    actual_outcome JSONB,
    accuracy DECIMAL(5,4),
    features_used JSONB,
    prediction_score DECIMAL(5,4),
    recommended_action TEXT,
    confidence_interval JSONB,
    model_version VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 17. FULL-TEXT SEARCH INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_search  ON film_projects      USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_dialogues_search ON script_dialogues   USING GIN(search_vector);

-- ============================================================
-- 18. JSONB INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_metadata  ON film_projects        USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_equipment_specs    ON equipment            USING GIN(specifications);
CREATE INDEX IF NOT EXISTS idx_risks_mitigation   ON production_risks     USING GIN(mitigation_steps);
CREATE INDEX IF NOT EXISTS idx_festival_metadata  ON festival_submissions USING GIN(festival_metadata);

-- ============================================================
-- 19. TRIGGERS FOR AUTO-UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_film_projects_updated_at BEFORE UPDATE ON film_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crew_members_updated_at BEFORE UPDATE ON crew_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cast_members_updated_at BEFORE UPDATE ON cast_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shoot_days_updated_at BEFORE UPDATE ON shoot_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 20. SEARCH VECTOR TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_project_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.director, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.logline, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_project_search_vector_trigger
BEFORE INSERT OR UPDATE ON film_projects
FOR EACH ROW EXECUTE FUNCTION update_project_search_vector();

CREATE OR REPLACE FUNCTION update_dialogue_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.dialogue_text, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.character_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.emotion_tag, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_dialogue_search_vector_trigger
BEFORE INSERT OR UPDATE ON script_dialogues
FOR EACH ROW EXECUTE FUNCTION update_dialogue_search_vector();

-- ============================================================
-- ============ DATA INSERTS ==================================
-- ============================================================

-- ------------------------------------------------------------
-- 1. INSERT FILM PROJECT
-- ------------------------------------------------------------
INSERT INTO film_projects (
    project_id, title, director, logline, genre, duration_minutes, status,
    total_budget, currency, start_date, end_date, metadata, tags
) VALUES (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'Chuttee',
    'Vikrant Mahalle',
    'Two protagonists stuck in an ironical situation created by themselves and pretending to be independent in a complex emotional environment.',
    'Drama',
    15,
    'Pre-Production',
    500000.00,
    'INR',
    '2026-08-01',
    '2026-08-04',
    jsonb_build_object(
        'festival_goals', to_jsonb(ARRAY['Pune Short Film Festival', 'MAMI', 'Berlinale']),
        'shooting_locations', to_jsonb(ARRAY['Pune', 'Mumbai']),
        'budget_breakdown', jsonb_build_object(
            'crew', 250000,
            'cast', 150000,
            'equipment', 100000,
            'post_production', 80000,
            'marketing', 50000
        ),
        'social_media', jsonb_build_object(
            'instagram', '@chutteefilm',
            'twitter', '#ChutteeFilm',
            'hashtag', to_jsonb(ARRAY['#Chuttee', '#ShortFilm', '#IndianCinema'])
        )
    ),
    ARRAY['Short Film', 'Drama', 'Independent', 'Award-Winning']
);

-- ------------------------------------------------------------
-- 2. INSERT CREW MEMBERS
-- ------------------------------------------------------------
INSERT INTO crew_members (
    project_id, full_name, role, department, experience_years, email, phone,
    daily_rate, is_available, joined_date, skills, emergency_contact, certifications
) VALUES
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Vikrant Mahalle', 'Director', 'Direction', 3.5, 'vikrant@chuttee.com', '+91-98765-00001', 15000.00, TRUE, '2026-06-01',
 ARRAY['Storytelling', 'Screenwriting', 'Acting Coach', 'Editing'],
 jsonb_build_object('name', 'Priya Mahalle', 'relationship', 'Spouse', 'phone', '+91-98765-00099'),
 jsonb_build_array(jsonb_build_object('name', 'Film Direction Certified', 'issuer', 'FTII', 'year', 2023))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Vishesh Gandhi', 'Cinematographer', 'Camera', 3.0, 'vishesh@chuttee.com', '+91-98765-00002', 12000.00, TRUE, '2026-06-01',
 ARRAY['Lighting', 'Composition', 'Color Grading', 'Drone Operation'],
 jsonb_build_object('name', 'Ritu Gandhi', 'relationship', 'Sister', 'phone', '+91-98765-00088'),
 jsonb_build_array(jsonb_build_object('name', 'Cinematography Diploma', 'issuer', 'FTII', 'year', 2024))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Vaishnavi Bhate', 'Editor', 'Post-Production', 5.0, 'vaishnavi@chuttee.com', '+91-98765-00003', 10000.00, TRUE, '2026-06-05',
 ARRAY['Adobe Premiere', 'DaVinci Resolve', 'Color Correction', 'Sound Syncing'],
 jsonb_build_object('name', 'Rahul Bhate', 'relationship', 'Brother', 'phone', '+91-98765-00077'),
 jsonb_build_array(jsonb_build_object('name', 'Film Editing Certified', 'issuer', 'Mumbai Film School', 'year', 2019))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Sumant Thakre', 'Sound Recordist', 'Sound', 5.0, 'sumant@chuttee.com', '+91-98765-00004', 8000.00, TRUE, '2026-06-01',
 ARRAY['Boom Operation', 'Audio Mixing', 'Sound Design', 'Field Recording'],
 jsonb_build_object('name', 'Meera Thakre', 'relationship', 'Mother', 'phone', '+91-98765-00066'),
 jsonb_build_array(jsonb_build_object('name', 'Sound Engineering', 'issuer', 'Audio Academy', 'year', 2018))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Umakant Jagtap', 'Sound Designer', 'Sound', 4.0, 'umakant@chuttee.com', '+91-98765-00005', 9000.00, TRUE, '2026-06-05',
 ARRAY['Audio Post-Production', 'Foley Design', 'Ambient Sound', 'ADR'],
 jsonb_build_object('name', 'Amrita Jagtap', 'relationship', 'Sister', 'phone', '+91-98765-00055'),
 jsonb_build_array(jsonb_build_object('name', 'Sound Design Certificate', 'issuer', 'FTII', 'year', 2020))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Ketam Jain', 'Music Composer', 'Music', 10.0, 'ketam@chuttee.com', '+91-98765-00006', 12000.00, TRUE, '2026-06-01',
 ARRAY['Piano', 'Orchestration', 'Music Production', 'Soundtrack Composition'],
 jsonb_build_object('name', 'Anjali Jain', 'relationship', 'Wife', 'phone', '+91-98765-00044'),
 jsonb_build_array(
    jsonb_build_object('name', 'Music Composition MA', 'issuer', 'Royal College of Music', 'year', 2014),
    jsonb_build_object('name', 'Film Scoring Certificate', 'issuer', 'Berklee', 'year', 2016))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Kaustubh Bhonge', 'Colorist', 'Post-Production', 3.0, 'kaustubh@chuttee.com', '+91-98765-00007', 8000.00, TRUE, '2026-06-05',
 ARRAY['DaVinci Resolve', 'Color Theory', 'Scene Matching', 'HDR Grading'],
 jsonb_build_object('name', 'Kavita Bhonge', 'relationship', 'Mother', 'phone', '+91-98765-00033'),
 jsonb_build_array(jsonb_build_object('name', 'Color Grading Professional', 'issuer', 'Color Academy', 'year', 2023))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Saimah Khan', 'Makeup Artist', 'Art', 2.5, 'saimah@chuttee.com', '+91-98765-00008', 5000.00, TRUE, '2026-06-10',
 ARRAY['Special Effects Makeup', 'Period Makeup', 'Hairstyling'],
 jsonb_build_object('name', 'Imran Khan', 'relationship', 'Brother', 'phone', '+91-98765-00022'),
 jsonb_build_array(jsonb_build_object('name', 'Makeup Artist Certified', 'issuer', 'L''Oreal Academy', 'year', 2023))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Abhishek Ingole', 'Assistant Director', 'Direction', 2.0, 'abhishek@chuttee.com', '+91-98765-00009', 6000.00, TRUE, '2026-06-01',
 ARRAY['Script Supervision', 'Crew Coordination', 'Continuity'],
 jsonb_build_object('name', 'Madhav Ingole', 'relationship', 'Father', 'phone', '+91-98765-00011'),
 jsonb_build_array(jsonb_build_object('name', 'Film Studies', 'issuer', 'University of Pune', 'year', 2024))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Sagar Khande', 'Assistant Director', 'Direction', 4.0, 'sagar@chuttee.com', '+91-98765-00010', 6000.00, TRUE, '2026-06-01',
 ARRAY['Production Management', 'Crew Scheduling', 'Location Scouting'],
 jsonb_build_object('name', 'Kiran Khande', 'relationship', 'Wife', 'phone', '+91-98765-00000'),
 jsonb_build_array(jsonb_build_object('name', 'Theatre Director', 'issuer', 'Tea4Theatre', 'year', 2022)));

-- ------------------------------------------------------------
-- 3. INSERT CAST MEMBERS
-- ------------------------------------------------------------
INSERT INTO cast_members (
    project_id, full_name, character_name, role_type, experience_years,
    email, phone, daily_rate, is_available, joined_date,
    physical_attributes, special_skills, representation
) VALUES
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Aadya Singh', 'Meera', 'Lead', 7.0, 'aadya@chuttee.com', '+91-98765-10001', 25000.00, TRUE, '2026-06-01',
 jsonb_build_object('height','5.6','weight','58kg','eye_color','Brown','hair_color','Black'),
 ARRAY['Classical Dance','Swimming','Accents: British, American'],
 jsonb_build_object('agent','Talent Agency Mumbai','email','agent@talent.com','phone','+91-98765-20001')),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Trupti Deore', 'Kavya', 'Lead', 3.0, 'trupti@chuttee.com', '+91-98765-10002', 20000.00, TRUE, '2026-06-01',
 jsonb_build_object('height','5.4','weight','55kg','eye_color','Black','hair_color','Dark Brown'),
 ARRAY['Theatre Acting','Singing','Yoga'],
 jsonb_build_object('agent','Creative Artists Agency','email','caa@creatives.com','phone','+91-98765-20002')),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Rohan Joshi', 'Arjun', 'Supporting', 5.0, 'rohan@chuttee.com', '+91-98765-10003', 12000.00, TRUE, '2026-06-10',
 jsonb_build_object('height','5.10','weight','72kg','eye_color','Green','hair_color','Brown'),
 ARRAY['Stage Combat','Horse Riding','Guitar'],
 jsonb_build_object('agent','Icon Talent','email','icon@talent.com','phone','+91-98765-20003')),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Neha Gupta', 'Priya', 'Supporting', 4.0, 'neha@chuttee.com', '+91-98765-10004', 10000.00, TRUE, '2026-06-10',
 jsonb_build_object('height','5.5','weight','60kg','eye_color','Hazel','hair_color','Brown'),
 ARRAY['Bollywood Dance','Cooking','Accents: Punjabi'],
 jsonb_build_object('agent','Star Talent','email','star@talent.com','phone','+91-98765-20004')),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Vikram Desai', 'Father', 'Supporting', 8.0, 'vikram@chuttee.com', '+91-98765-10005', 8000.00, TRUE, '2026-06-15',
 jsonb_build_object('height','5.11','weight','78kg','eye_color','Brown','hair_color','Grey'),
 ARRAY['Theatre Acting','Monologue Delivery'],
 jsonb_build_object('agent','Veteran Artists','email','veteran@artists.com','phone','+91-98765-20005')),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Meera Iyer', 'Mother', 'Supporting', 9.0, 'meera.iyer@chuttee.com', '+91-98765-10006', 8000.00, TRUE, '2026-06-15',
 jsonb_build_object('height','5.3','weight','62kg','eye_color','Brown','hair_color','Black'),
 ARRAY['Cooking Show Host','Accents: Tamil, Malayalam'],
 jsonb_build_object('agent','South India Talent','email','south@talent.com','phone','+91-98765-20006')),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Kiran Patil', 'Friend 1', 'Cameo', 2.0, 'kiran@chuttee.com', '+91-98765-10007', 5000.00, TRUE, '2026-06-20',
 jsonb_build_object('height','5.8','weight','68kg','eye_color','Black','hair_color','Black'),
 ARRAY['Stand-up Comedy','Improv'],
 jsonb_build_object('agent','Comedy Collective','email','comedy@collective.com','phone','+91-98765-20007')),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Sneha Reddy', 'Friend 2', 'Cameo', 1.5, 'sneha@chuttee.com', '+91-98765-10008', 5000.00, TRUE, '2026-06-20',
 jsonb_build_object('height','5.5','weight','56kg','eye_color','Brown','hair_color','Auburn'),
 ARRAY['Modern Dance','Singing'],
 jsonb_build_object('agent','NextGen Artists','email','nextgen@artists.com','phone','+91-98765-20008'));

-- ------------------------------------------------------------
-- 4. INSERT SCENES
-- ------------------------------------------------------------
INSERT INTO scenes (
    project_id, scene_number, location, time_of_day, complexity_score,
    emotional_tone, duration_estimate_minutes, is_indoor, status,
    props, wardrobe, lighting_notes, sound_notes, camera_notes
)
SELECT
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    scene_num, location, time_of_day, complexity, emotion, duration, indoor, status,
    props_json, wardrobe_json, lighting, sound, camera
FROM (VALUES
    (1, 'Kitchen', 'Morning', 0.30, 'Neutral', 5, TRUE, 'Ready',
     '["Coffee mug", "Newspaper", "Phone", "Keys"]'::jsonb,
     '["Casual home wear", "Apron"]'::jsonb,
     'Natural light from window, warm tones',
     'Ambient kitchen sounds, coffee brewing',
     'Close-ups for facial expressions'),
    (2, 'Living Room', 'Afternoon', 0.70, 'Tense', 8, TRUE, 'Ready',
     '["Sofa", "Coffee table", "Books", "Remote"]'::jsonb,
     '["Formal wear", "Accessories"]'::jsonb,
     'Harsh daylight, contrast shadows',
     'Dialogue heavy, minimal ambient',
     'Medium shots, two-shots'),
    (3, 'Bedroom', 'Morning', 0.40, 'Melancholic', 6, TRUE, 'Ready',
     '["Bed", "Pillow", "Journal", "Lamp"]'::jsonb,
     '["Sleepwear", "Comfortable clothes"]'::jsonb,
     'Soft, diffused morning light',
     'Quiet, intimate sounds',
     'Close-ups, intimate angles'),
    (4, 'Kitchen', 'Evening', 0.50, 'Warm', 7, TRUE, 'Ready',
     '["Cooking utensils", "Dinner plates", "Wine glass"]'::jsonb,
     '["Evening wear", "Apron"]'::jsonb,
     'Warm, golden tones, practical kitchen lights',
     'Background music, cooking sounds',
     'Wide establishing shots'),
    (5, 'Living Room', 'Night', 0.80, 'Confrontational', 10, TRUE, 'Pending',
     '["Lamp", "Table", "Drinks", "Clock"]'::jsonb,
     '["Formal evening wear"]'::jsonb,
     'Low-key lighting, dramatic shadows',
     'Tense silence, heavy breathing',
     'Close-ups, handheld for intensity'),
    (6, 'Outdoor Garden', 'Afternoon', 0.45, 'Hopeful', 5, FALSE, 'Ready',
     '["Garden chair", "Flowers", "Watering can"]'::jsonb,
     '["Summer dress", "Sunglasses"]'::jsonb,
     'Natural sunlight, golden hour',
     'Birds, wind, nature sounds',
     'Wide shots, tracking'),
    (7, 'Office', 'Morning', 0.35, 'Professional', 4, TRUE, 'Pending',
     '["Laptop", "Papers", "Phone", "Coffee cup"]'::jsonb,
     '["Formal office wear", "Blazer"]'::jsonb,
     'Fluorescent lights, harsh',
     'Computer sounds, office chatter',
     'Over-the-shoulder shots'),
    (8, 'Restaurant', 'Evening', 0.60, 'Romantic', 8, TRUE, 'Pending',
     '["Table with candles", "Menus", "Wine"]'::jsonb,
     '["Formal dinner wear", "Jewelry"]'::jsonb,
     'Candlelight, warm ambient lighting',
     'Background jazz music, restaurant ambiance',
     'Close-ups, shallow depth of field'),
    (9, 'Street', 'Night', 0.75, 'Suspenseful', 6, FALSE, 'Pending',
     '["Street lamp", "Phone", "Bags"]'::jsonb,
     '["Casual winter wear"]'::jsonb,
     'Street lights, car headlights',
     'Traffic sounds, distant sirens',
     'Handheld for dynamic movement'),
    (10, 'Kitchen', 'Night', 0.55, 'Intimate', 7, TRUE, 'Ready',
     '["Kitchen island", "Snacks", "Drinks"]'::jsonb,
     '["Pajamas", "Casual wear"]'::jsonb,
     'Dim kitchen lights, intimate feel',
     'Quiet, whispered dialogue',
     'Medium close-ups'),
    (11, 'Park', 'Afternoon', 0.40, 'Nostalgic', 5, FALSE, 'Pending',
     '["Park bench", "Book", "Coffee"]'::jsonb,
     '["Casual day wear"]'::jsonb,
     'Natural light, dappled shadows',
     'Children playing, birds',
     'Wide establishing, then close-ups'),
    (12, 'Living Room', 'Morning', 0.65, 'Reconciliation', 9, TRUE, 'Pending',
     '["Sofa", "Window", "Family photos"]'::jsonb,
     '["Comfortable morning wear"]'::jsonb,
     'Bright morning light, hopeful',
     'Emotional dialogue, soft background',
     'Medium shots, emotional close-ups')
) AS scenes_data(scene_num, location, time_of_day, complexity, emotion, duration, indoor, status, props_json, wardrobe_json, lighting, sound, camera);

-- ------------------------------------------------------------
-- 5. INSERT SCENE-ACTOR MAPPINGS
-- ------------------------------------------------------------
INSERT INTO scene_actors (
    scene_id, cast_id, lines_count, screen_time_minutes, rehearsal_hours, performance_notes
)
SELECT
    s.scene_id,
    c.cast_id,
    (floor(random() * 30 + 15))::int,
    (floor(random() * 8 + 2))::int,
    ROUND((random() * 3 + 0.5)::NUMERIC, 2),
    CASE floor(random() * 3)
        WHEN 0 THEN 'Great chemistry'
        WHEN 1 THEN 'Need more rehearsal'
        ELSE 'Solid performance'
    END
FROM scenes s
CROSS JOIN cast_members c
WHERE s.project_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'
  AND c.project_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'
  AND random() < 0.4
LIMIT 22;

-- ------------------------------------------------------------
-- 6. INSERT SCRIPT DIALOGUES
-- ------------------------------------------------------------
WITH dialogues_data AS (
    SELECT
        s.scene_id,
        d.character,
        d.dialogue_text,
        d.dialogue_order,
        d.emotion,
        d.intensity,
        d.tone,
        d.conflict,
        d.romance
    FROM scenes s
    CROSS JOIN LATERAL (
        VALUES
        ('Meera', 'Another day, another routine. Sometimes I wonder if this is all there is.', 1, 'Melancholic', 0.65, 'Contemplative', FALSE, FALSE),
        ('Meera', 'The coffee tastes different today. Bitter... like my thoughts.', 2, 'Pensive', 0.55, 'Reflective', FALSE, FALSE),
        ('Meera', 'You don''t understand what it''s like to carry this burden alone.', 3, 'Angry', 0.85, 'Confrontational', TRUE, FALSE),
        ('Kavya', 'Alone? I''ve been here the whole time! You''re the one who shut me out.', 4, 'Frustrated', 0.80, 'Confrontational', TRUE, FALSE),
        ('Meera', 'Some things can''t be fixed with just "being here." You know that.', 5, 'Sad', 0.75, 'Emotional', TRUE, FALSE),
        ('Kavya', 'Then tell me what you need, Meera. I''m not a mind reader.', 6, 'Pleading', 0.70, 'Emotional', TRUE, FALSE),
        ('Meera', 'Looking at myself in the mirror, I see a stranger.', 7, 'Melancholic', 0.90, 'Introspective', FALSE, FALSE),
        ('Meera', 'The person looking back... she''s tired. So tired.', 8, 'Exhausted', 0.85, 'Sad', FALSE, FALSE),
        ('Meera', 'I don''t think I can keep doing this. Every day is a performance.', 9, 'Hopeless', 0.75, 'Emotional', TRUE, FALSE),
        ('Kavya', 'What are you saying? We''re in this together, remember?', 10, 'Concerned', 0.70, 'Supportive', TRUE, FALSE),
        ('Meera', 'Are we? Because it feels like I''m fighting a war alone.', 11, 'Angry', 0.80, 'Confrontational', TRUE, FALSE),
        ('Meera', 'You want the truth? The truth is I''ve been pretending for years!', 12, 'Angry', 0.95, 'Confrontational', TRUE, FALSE),
        ('Kavya', 'Pretending? I gave you everything! My time, my love, my life!', 13, 'Angry', 0.90, 'Emotional', TRUE, FALSE),
        ('Meera', 'And that''s supposed to make it all okay?', 14, 'Bitter', 0.85, 'Confrontational', TRUE, FALSE),
        ('Arjun', 'Stop this! Both of you. This isn''t who we are.', 15, 'Desperate', 0.80, 'Pleading', TRUE, FALSE),
        ('Meera', 'The flowers bloom even when nobody is watching.', 16, 'Hopeful', 0.60, 'Inspirational', FALSE, FALSE),
        ('Arjun', 'That''s because they know their purpose. Do you know yours?', 17, 'Pensive', 0.55, 'Philosophical', FALSE, FALSE),
        ('Kavya', 'Another day in this cubicle. What am I even doing with my life?', 18, 'Frustrated', 0.70, 'Workplace', FALSE, FALSE),
        ('Kavya', 'I need a break. I need to feel alive again.', 19, 'Yearning', 0.75, 'Contemplative', FALSE, FALSE),
        ('Meera', 'This place... it reminds me of our first date.', 20, 'Nostalgic', 0.70, 'Romantic', FALSE, TRUE),
        ('Priya', 'You remember that? I thought you''d forgotten everything.', 21, 'Tender', 0.80, 'Romantic', FALSE, TRUE),
        ('Meera', 'Some things you never forget, no matter how hard you try.', 22, 'Emotional', 0.75, 'Romantic', FALSE, TRUE),
        ('Meera', 'The city lights don''t hide the darkness inside.', 23, 'Melancholic', 0.85, 'Dark', TRUE, FALSE),
        ('Father', 'Darkness is just the absence of light. You have to create your own.', 24, 'Wisdom', 0.70, 'Inspirational', FALSE, FALSE),
        ('Meera', 'I can''t sleep. My mind keeps racing.', 25, 'Anxious', 0.80, 'Emotional', FALSE, FALSE),
        ('Kavya', 'You''re not the only one with demons, you know.', 26, 'Empathetic', 0.75, 'Supportive', FALSE, FALSE),
        ('Meera', 'I miss being carefree. When did everything get so complicated?', 27, 'Nostalgic', 0.70, 'Contemplative', FALSE, FALSE),
        ('Friend', 'It''s called growing up. It happens to everyone.', 28, 'Matter-of-fact', 0.50, 'Friendly', FALSE, FALSE),
        ('Meera', 'I''m sorry. For everything. I was scared.', 29, 'Sincere', 0.85, 'Apologetic', TRUE, FALSE),
        ('Kavya', 'We''re both scared. That''s what made us lash out at each other.', 30, 'Forgiving', 0.80, 'Emotional', TRUE, FALSE),
        ('Meera', 'Can we start over? I don''t want to lose you.', 31, 'Pleading', 0.90, 'Emotional', TRUE, FALSE),
        ('Kavya', 'We never lost each other. We just lost our way.', 32, 'Hopeful', 0.85, 'Emotional', TRUE, FALSE)
    ) AS d(character, dialogue_text, dialogue_order, emotion, intensity, tone, conflict, romance)
    WHERE s.scene_number = ((d.dialogue_order - 1) % 12) + 1
)
INSERT INTO script_dialogues (
    project_id, scene_id, character_name, dialogue_text, dialogue_order,
    emotion_tag, intensity_score, tone_category, has_conflict, has_romance,
    word_count
)
SELECT
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    scene_id,
    character,
    dialogue_text,
    dialogue_order,
    emotion,
    intensity,
    tone,
    conflict,
    romance,
    array_length(string_to_array(dialogue_text, ' '), 1) AS word_count
FROM dialogues_data
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 7. INSERT PRODUCTION RISKS
-- ------------------------------------------------------------
INSERT INTO production_risks (
    project_id, risk_date, risk_type, severity, probability, impact,
    mitigation_plan, owner, status, category, triggers
)
SELECT
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    current_date + (random() * 60)::int,
    (ARRAY['Weather', 'Budget', 'Schedule', 'Technical', 'Human Resources', 'Legal', 'Security'])[floor(random() * 7 + 1)::int],
    (ARRAY['Low', 'Medium', 'High', 'Critical'])[floor(random() * 4 + 1)::int],
    ROUND(CAST(random() * 0.5 + 0.1 AS NUMERIC), 3),
    ROUND(CAST(random() * 0.5 + 0.2 AS NUMERIC), 3),
    CASE floor(random() * 4)
        WHEN 0 THEN 'Monitor weather forecast daily and have backup indoor locations'
        WHEN 1 THEN 'Implement daily budget tracking and alert system'
        WHEN 2 THEN 'Create contingency schedule with buffer days'
        ELSE 'Have backup equipment ready and trained technicians'
    END,
    (ARRAY['Vikrant Mahalle', 'Vishesh Gandhi', 'Sanjay Mehta', 'Vaishnavi Bhate'])[floor(random() * 4 + 1)::int],
    (ARRAY['Identified', 'Mitigating', 'Resolved', 'Escalated'])[floor(random() * 4 + 1)::int],
    (ARRAY['Production', 'Logistics', 'Financial', 'Technical'])[floor(random() * 4 + 1)::int],
    ARRAY['Heavy rain forecast', 'Budget overspending', 'Crew illness', 'Equipment failure']
FROM generate_series(1, 15);

-- ------------------------------------------------------------
-- 8. INSERT SHOOT DAYS
-- ------------------------------------------------------------
INSERT INTO shoot_days (
    project_id, shoot_date, day_number, location, weather_condition,
    temperature_celsius, is_rained, crew_present, cast_present,
    start_time, end_time, total_hours, status, notes, weather_data
) VALUES
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '2026-08-01', 1, 'Kitchen Studio', 'Clear', 28.5, FALSE, 12, 2, '06:00:00', '14:00:00', 8.0, 'Completed', 'Day 1 - Kitchen scenes completed successfully', jsonb_build_object('humidity', 65, 'wind_speed', 10, 'visibility', 'Good')),
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '2026-08-02', 2, 'Living Room Set', 'Partly Cloudy', 27.0, FALSE, 13, 3, '07:00:00', '16:00:00', 9.0, 'Completed', 'Day 2 - Living room scenes with both leads', jsonb_build_object('humidity', 70, 'wind_speed', 8, 'visibility', 'Good')),
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '2026-08-03', 3, 'Outdoor Location', 'Sunny', 32.5, FALSE, 15, 4, '05:30:00', '13:30:00', 8.0, 'Completed', 'Day 3 - Outdoor scenes with good natural light', jsonb_build_object('humidity', 55, 'wind_speed', 5, 'visibility', 'Excellent')),
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '2026-08-04', 4, 'Multiple Locations', 'Rainy', 24.0, TRUE, 14, 3, '08:00:00', '12:00:00', 4.0, 'Cancelled', 'Day 4 - Cancelled due to rain. Rescheduled', jsonb_build_object('humidity', 85, 'wind_speed', 25, 'visibility', 'Poor'));

-- ------------------------------------------------------------
-- 9. INSERT BUDGET TRANSACTIONS
-- ------------------------------------------------------------
INSERT INTO budget_transactions (
    project_id, category, description, amount, transaction_date,
    vendor_name, receipt_number, approved_by, payment_method,
    invoice_number, tax_amount, metadata
)
SELECT
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    category,
    description,
    amount,
    transaction_date::DATE,
    vendor_name,
    receipt_number,
    approved_by,
    payment_method,
    invoice_number,
    tax_amount,
    jsonb_build_object('approved', true, 'payment_status', 'Paid', 'department', 'Production')
FROM (VALUES
    ('Crew', 'Director advance payment', 75000.00, '2026-06-01', 'Vikrant Mahalle', 'REC-001', 'Production Manager', 'Bank Transfer', 'INV-001', 7500.00),
    ('Crew', 'Cinematographer advance', 60000.00, '2026-06-01', 'Vishesh Gandhi', 'REC-002', 'Production Manager', 'Bank Transfer', 'INV-002', 6000.00),
    ('Crew', 'Editor retainer fee', 50000.00, '2026-06-05', 'Vaishnavi Bhate', 'REC-003', 'Production Manager', 'Bank Transfer', 'INV-003', 5000.00),
    ('Cast', 'Lead actor advance - Aadya Singh', 100000.00, '2026-06-01', 'Aadya Singh', 'REC-004', 'Director', 'Bank Transfer', 'INV-004', 10000.00),
    ('Cast', 'Lead actor advance - Trupti Deore', 80000.00, '2026-06-01', 'Trupti Deore', 'REC-005', 'Director', 'Bank Transfer', 'INV-005', 8000.00),
    ('Equipment', 'Camera rental - Sony A7 III', 15000.00, '2026-07-01', 'CineEquip Rentals', 'REC-006', 'Production Manager', 'Credit Card', 'INV-006', 1500.00),
    ('Equipment', 'Lens rental - 24-70mm GM', 8000.00, '2026-07-01', 'CineEquip Rentals', 'REC-007', 'Production Manager', 'Credit Card', 'INV-007', 800.00),
    ('Equipment', 'Gimbal rental - DJI Ronin-S', 4000.00, '2026-07-01', 'CineEquip Rentals', 'REC-008', 'Production Manager', 'Credit Card', 'INV-008', 400.00),
    ('Equipment', 'Audio equipment rental', 5500.00, '2026-07-01', 'AudioPro India', 'REC-009', 'Production Manager', 'Credit Card', 'INV-009', 550.00),
    ('Location', 'Studio rental - Kitchen Set', 25000.00, '2026-07-15', 'Film City Studios', 'REC-010', 'Production Manager', 'Bank Transfer', 'INV-010', 2500.00),
    ('Location', 'Studio rental - Living Room Set', 25000.00, '2026-07-15', 'Film City Studios', 'REC-011', 'Production Manager', 'Bank Transfer', 'INV-011', 2500.00),
    ('Location', 'Outdoor location permit', 15000.00, '2026-07-20', 'Municipal Corporation', 'REC-012', 'Production Manager', 'Cash', 'INV-012', 1500.00),
    ('Post_Production', 'Editing suite rental', 30000.00, '2026-07-20', 'PostHouse India', 'REC-013', 'Editor', 'Bank Transfer', 'INV-013', 3000.00),
    ('Crew', 'Sound designer retainer', 45000.00, '2026-06-10', 'Umakant Jagtap', 'REC-014', 'Director', 'Bank Transfer', 'INV-014', 4500.00),
    ('Crew', 'Music composer advance', 60000.00, '2026-06-15', 'Ketam Jain', 'REC-015', 'Director', 'Bank Transfer', 'INV-015', 6000.00),
    ('Miscellaneous', 'Catering for shoot days', 20000.00, '2026-07-25', 'Gourmet Catering', 'REC-016', 'Production Manager', 'Credit Card', 'INV-016', 2000.00),
    ('Miscellaneous', 'Transportation - Crew', 15000.00, '2026-07-25', 'CityCabs India', 'REC-017', 'Production Manager', 'Credit Card', 'INV-017', 1500.00),
    ('Miscellaneous', 'Costume design and creation', 25000.00, '2026-07-10', 'Design Studio', 'REC-018', 'Costume Designer', 'Bank Transfer', 'INV-018', 2500.00),
    ('Miscellaneous', 'Makeup supplies', 10000.00, '2026-07-15', 'BeautyPro Store', 'REC-019', 'Makeup Artist', 'Cash', 'INV-019', 1000.00),
    ('Insurance', 'Insurance premium', 15000.00, '2026-07-01', 'Film Insurance Co', 'REC-020', 'Production Manager', 'Bank Transfer', 'INV-020', 1500.00)
) AS transactions(category, description, amount, transaction_date, vendor_name, receipt_number, approved_by, payment_method, invoice_number, tax_amount);

-- ------------------------------------------------------------
-- 10. INSERT FESTIVAL SUBMISSIONS
-- ------------------------------------------------------------
INSERT INTO festival_submissions (
    project_id, festival_name, festival_category, submission_date,
    submission_fee, status, selection_probability, notes,
    festival_metadata, submission_documents
) VALUES
('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Pune Short Film Festival', 'International Short Film', '2026-09-01', 1500.00, 'Pending', 0.85, 'High probability based on similar films',
 jsonb_build_object('website', 'https://puneshortfilmfestival.com', 'edition', '2026', 'deadline', '2026-08-15'),
 jsonb_build_array(
    jsonb_build_object('name', 'Entry Form', 'uploaded', true),
    jsonb_build_object('name', 'Screening Copy', 'uploaded', false))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Mumbai Academy (MAMI)', 'Indian Cinema', '2026-09-10', 2000.00, 'Pending', 0.78, 'Strong cultural relevance',
 jsonb_build_object('website', 'https://mami.org', 'edition', '2026', 'deadline', '2026-08-20'),
 jsonb_build_array(jsonb_build_object('name', 'Submission Form', 'uploaded', true))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Berlin International Film Festival', 'Short Film', '2026-10-01', 3500.00, 'Pending', 0.65, 'International exposure potential',
 jsonb_build_object('website', 'https://berlinale.com', 'edition', '2026', 'deadline', '2026-09-01'),
 jsonb_build_array(jsonb_build_object('name', 'Online Entry', 'uploaded', true))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Indian Film Festival (IFFI)', 'Indian Cinema', '2026-10-15', 2500.00, 'Pending', 0.82, 'Strong narrative for Indian audience',
 jsonb_build_object('website', 'https://iffi.goa.gov.in', 'edition', '2026', 'deadline', '2026-09-15'),
 jsonb_build_array(jsonb_build_object('name', 'Official Entry', 'uploaded', true))),

('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Cannes Short Film Corner', 'International', '2026-11-01', 4000.00, 'Pending', 0.55, 'Competitive but prestigious',
 jsonb_build_object('website', 'https://cannes.com', 'edition', '2026', 'deadline', '2026-10-01'),
 jsonb_build_array(jsonb_build_object('name', 'Cannes Entry', 'uploaded', false)));

-- ------------------------------------------------------------
-- 11. INSERT ANALYTICS DAILY
-- ------------------------------------------------------------
INSERT INTO analytics_daily (
    project_id, date, daily_budget_spent, cumulative_budget_spent,
    scenes_completed_today, cumulative_scenes_completed,
    average_takes_today, crew_attendance_rate,
    equipment_uptime_percentage, sentiment_score_today,
    risk_score_today, productivity_score, key_metrics
)
SELECT
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    current_date - (30 - day_num)::int,
    ROUND(CAST(random() * 50000 + 10000 AS NUMERIC), 2),
    ROUND(CAST((random() * 500000 + 200000) + (day_num * 15000) AS NUMERIC), 2),
    floor(random() * 2)::int,
    floor(random() * 12 + 1)::int,
    ROUND(CAST(random() * 3 + 3 AS NUMERIC), 2),
    ROUND(CAST(random() * 15 + 80 AS NUMERIC), 2),
    ROUND(CAST(random() * 10 + 85 AS NUMERIC), 2),
    ROUND(CAST(random() * 0.5 + 0.3 AS NUMERIC), 3),
    ROUND(CAST(random() * 0.4 + 0.1 AS NUMERIC), 3),
    ROUND(CAST(random() * 0.3 + 0.5 AS NUMERIC), 3),
    jsonb_build_object(
        'scenes', jsonb_build_object('planned', 12, 'completed', floor(random() * 12)::int),
        'budget', jsonb_build_object('daily', ROUND(CAST(random() * 50000 AS NUMERIC), 2))
    )
FROM generate_series(1, 30) AS day_num;

-- ============================================================
-- 12. MATERIALIZED VIEWS
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS mv_production_summary CASCADE;
CREATE MATERIALIZED VIEW mv_production_summary AS
SELECT
    p.project_id,
    p.title,
    p.director,
    p.status,
    p.total_budget,
    COALESCE(SUM(bt.amount), 0) AS spent_amount,
    p.total_budget - COALESCE(SUM(bt.amount), 0) AS remaining_budget,
    ROUND(COALESCE(SUM(bt.amount), 0) / NULLIF(p.total_budget, 0) * 100, 2) AS budget_used_percentage,
    COUNT(DISTINCT cm.crew_id) AS total_crew,
    COUNT(DISTINCT ca.cast_id) AS total_cast,
    COUNT(DISTINCT s.scene_id) AS total_scenes,
    COUNT(DISTINCT CASE WHEN s.status = 'Completed' THEN s.scene_id END) AS completed_scenes,
    COUNT(DISTINCT sd.shoot_day_id) AS total_shoot_days,
    COUNT(DISTINCT CASE WHEN sd.status = 'Completed' THEN sd.shoot_day_id END) AS completed_shoot_days
FROM film_projects p
LEFT JOIN budget_transactions bt ON p.project_id = bt.project_id
LEFT JOIN crew_members cm       ON p.project_id = cm.project_id
LEFT JOIN cast_members ca       ON p.project_id = ca.project_id
LEFT JOIN scenes s              ON p.project_id = s.project_id
LEFT JOIN shoot_days sd         ON p.project_id = sd.project_id
WHERE p.project_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'
GROUP BY p.project_id;

DROP MATERIALIZED VIEW IF EXISTS mv_scene_analysis CASCADE;
CREATE MATERIALIZED VIEW mv_scene_analysis AS
SELECT
    s.scene_id,
    s.scene_number,
    s.complexity_score,
    s.emotional_tone,
    s.status,
    COUNT(DISTINCT sa.cast_id) AS actor_count,
    AVG(sa.lines_count) AS avg_lines,
    AVG(sa.screen_time_minutes) AS avg_screen_time,
    AVG(sa.rehearsal_hours) AS avg_rehearsal_hours
FROM scenes s
LEFT JOIN scene_actors sa ON s.scene_id = sa.scene_id
WHERE s.project_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'
GROUP BY s.scene_id;

DROP MATERIALIZED VIEW IF EXISTS mv_sentiment_trends CASCADE;
CREATE MATERIALIZED VIEW mv_sentiment_trends AS
SELECT
    date_trunc('week', sa.analyzed_date) AS week_start,
    AVG(sa.polarity) AS avg_polarity,
    AVG(sa.subjectivity) AS avg_subjectivity,
    COUNT(*) AS dialogue_count
FROM sentiment_analysis sa
WHERE sa.project_id = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'
GROUP BY date_trunc('week', sa.analyzed_date)
ORDER BY week_start DESC;

-- ============================================================
-- 13. FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_probability DECIMAL,
    p_impact DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(p_probability, 0) * COALESCE(p_impact, 0) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_production_health(
    p_project_id UUID
) RETURNS TABLE(
    metric VARCHAR(50),
    value DECIMAL(5,2),
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'Budget Health'::VARCHAR,
        ROUND(
            (SELECT COALESCE(SUM(amount), 0) / NULLIF(total_budget, 0) * 100
             FROM budget_transactions, film_projects
             WHERE film_projects.project_id = p_project_id
               AND budget_transactions.project_id = p_project_id)::DECIMAL(5,2), 2),
        CASE
            WHEN (SELECT COALESCE(SUM(amount), 0) / NULLIF(total_budget, 0) * 100
                  FROM budget_transactions, film_projects
                  WHERE film_projects.project_id = p_project_id
                    AND budget_transactions.project_id = p_project_id) < 70
            THEN 'Good'
            ELSE 'Warning'
        END;

    RETURN QUERY
    SELECT
        'Schedule Health'::VARCHAR,
        ROUND(
            (SELECT COUNT(*)::DECIMAL / NULLIF(12, 0) * 100
             FROM scenes
             WHERE project_id = p_project_id AND status = 'Completed')::DECIMAL(5,2), 2),
        CASE
            WHEN (SELECT COUNT(*)::DECIMAL / NULLIF(12, 0) * 100
                  FROM scenes
                  WHERE project_id = p_project_id AND status = 'Completed') > 50
            THEN 'Good'
            ELSE 'Warning'
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 14. ML FEATURES VIEW
-- ============================================================
DROP VIEW IF EXISTS vw_ml_features_complete CASCADE;
CREATE OR REPLACE VIEW vw_ml_features_complete AS
SELECT
    p.project_id,
    p.title,
    p.total_budget,
    p.status,
    COALESCE(SUM(bt.amount), 0) AS total_spent,
    COALESCE(SUM(CASE WHEN bt.category = 'Crew' THEN bt.amount END), 0) AS crew_cost,
    COALESCE(SUM(CASE WHEN bt.category = 'Cast' THEN bt.amount END), 0) AS cast_cost,
    COALESCE(SUM(CASE WHEN bt.category = 'Equipment' THEN bt.amount END), 0) AS equipment_cost,
    COUNT(DISTINCT cm.crew_id) AS crew_count,
    AVG(cm.experience_years) AS avg_crew_experience,
    COUNT(DISTINCT ca.cast_id) AS cast_count,
    AVG(ca.experience_years) AS avg_cast_experience,
    COUNT(DISTINCT s.scene_id) AS total_scenes,
    COUNT(DISTINCT CASE WHEN s.status = 'Completed' THEN s.scene_id END) AS completed_scenes,
    AVG(s.complexity_score) AS avg_complexity,
    COUNT(DISTINCT sd.shoot_day_id) AS total_shoot_days,
    SUM(CASE WHEN sd.status = 'Completed' THEN sd.total_hours ELSE 0 END) AS total_production_hours,
    COUNT(DISTINCT pr.risk_id) AS total_risks,
    COUNT(DISTINCT CASE WHEN pr.severity IN ('High', 'Critical') THEN pr.risk_id END) AS high_risks,
    AVG(pr.risk_score) AS avg_risk_score,
    AVG(sa.polarity) AS avg_sentiment_polarity,
    AVG(sa.subjectivity) AS avg_sentiment_subjectivity,
    p.duration_minutes AS runtime_prediction
FROM film_projects p
LEFT JOIN budget_transactions bt ON p.project_id = bt.project_id
LEFT JOIN crew_members cm       ON p.project_id = cm.project_id
LEFT JOIN cast_members ca       ON p.project_id = ca.project_id
LEFT JOIN scenes s              ON p.project_id = s.project_id
LEFT JOIN shoot_days sd         ON p.project_id = sd.project_id
LEFT JOIN production_risks pr   ON p.project_id = pr.project_id
LEFT JOIN sentiment_analysis sa ON p.project_id = sa.project_id
GROUP BY p.project_id;

-- ============================================================
-- 15. INDEXES + REINDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_project_id ON film_projects(project_id);

REINDEX SCHEMA public;
REINDEX TABLE film_projects;
REINDEX INDEX idx_project_id;

-- ============================================================
-- 16. VERIFICATION QUERIES
-- ============================================================
SELECT 'Total Projects'       AS metrics, COUNT(*) FROM film_projects
UNION ALL
SELECT 'Total Crew',          COUNT(*) FROM crew_members
UNION ALL
SELECT 'Total Cast',          COUNT(*) FROM cast_members
UNION ALL
SELECT 'Total Scenes',        COUNT(*) FROM scenes
UNION ALL
SELECT 'Total Dialogues',     COUNT(*) FROM script_dialogues
UNION ALL
SELECT 'Total Sentiments',    COUNT(*) FROM sentiment_analysis
UNION ALL
SELECT 'Total Risks',         COUNT(*) FROM production_risks
UNION ALL
SELECT 'Total Transactions',  COUNT(*) FROM budget_transactions
UNION ALL
SELECT 'Total Analytics Days',COUNT(*) FROM analytics_daily
UNION ALL
SELECT 'Total Festivals',     COUNT(*) FROM festival_submissions;