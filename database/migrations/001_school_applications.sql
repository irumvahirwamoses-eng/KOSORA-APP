-- School Applications (for schools that want to join Kosora)
CREATE TABLE IF NOT EXISTS school_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    school_type ENUM('primary', 'secondary', 'both') DEFAULT 'both',
    student_count INT,
    message TEXT,
    status ENUM('pending', 'approved', 'rejected', 'registered') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_applications_status ON school_applications(status);
