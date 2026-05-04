-- Migration: Add assessment_type column to exams table
-- Run this if you already have the database created
USE kosora_db;

ALTER TABLE exams ADD COLUMN IF NOT EXISTS assessment_type ENUM('exam', 'quiz', 'short_assessment') DEFAULT 'exam' AFTER academic_year;
