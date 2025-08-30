-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: begr5npk9smo955afrh3-mysql.services.clever-cloud.com:3306
-- Generation Time: Aug 30, 2025 at 06:50 PM
-- Server version: 8.0.22-13
-- PHP Version: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `begr5npk9smo955afrh3`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('super_admin','admin','moderator') COLLATE utf8mb4_general_ci DEFAULT 'admin',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `email`, `password_hash`, `username`, `role`, `permissions`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'spbaruah000@gmail.com', '$2a$12$tHMxz4sgiRQBtKj/9Cd5s.yZECXLTkzLNP1vArFKaVxSKmFny.mHq', 'Admin', 'super_admin', '[\"all\"]', 1, '2025-08-30 18:01:34', '2025-08-29 09:56:46', '2025-08-30 18:01:34');

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `image_url` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `cta_text` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cta_link` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `description`, `image_url`, `cta_text`, `cta_link`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(5, 'unihorn tech', 'website at 10 days', 'https://res.cloudinary.com/ddjsd5hqu/image/upload/v1756577290/axomclash/banners/upuuqrsqzk5ug88nopxx.jpg', 'unihorn tech', 'https://unihorntech.com/', 0, 1, '2025-08-30 18:08:12', '2025-08-30 18:08:12'),
(6, 'industrro', 'b2b marketplace', 'https://res.cloudinary.com/ddjsd5hqu/image/upload/v1756577381/axomclash/banners/tj2vua8t3tii9qqfrgfx.jpg', 'cronida', 'https://industrro.com/', 0, 1, '2025-08-30 18:09:44', '2025-08-30 18:09:44');

-- --------------------------------------------------------

--
-- Table structure for table `challenges`
--

CREATE TABLE `challenges` (
  `id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `type` enum('daily','weekly','monthly','special') COLLATE utf8mb4_general_ci NOT NULL,
  `points_reward` int NOT NULL,
  `college_points_reward` int NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `max_participants` int DEFAULT '0',
  `current_participants` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `challenges`
--

INSERT INTO `challenges` (`id`, `title`, `description`, `type`, `points_reward`, `college_points_reward`, `start_date`, `end_date`, `max_participants`, `current_participants`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Daily Login', 'Login to the app today and earn points!', 'daily', 10, 10, '2023-12-31 18:30:00', '2024-12-31 18:29:59', 0, 0, 1, '2025-08-29 09:56:46', '2025-08-29 09:56:46'),
(2, 'First Post', 'Create your first post and earn bonus points!', 'special', 50, 50, '2023-12-31 18:30:00', '2024-12-31 18:29:59', 0, 0, 1, '2025-08-29 09:56:46', '2025-08-29 09:56:46'),
(3, 'Weekly Quiz', 'Participate in this week\'s quiz challenge', 'weekly', 100, 100, '2023-12-31 18:30:00', '2024-12-31 18:29:59', 0, 0, 1, '2025-08-29 09:56:46', '2025-08-29 09:56:46');

-- --------------------------------------------------------

--
-- Table structure for table `challenge_participants`
--

CREATE TABLE `challenge_participants` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `user_id` int NOT NULL,
  `college_id` int NOT NULL,
  `status` enum('participating','completed','failed') COLLATE utf8mb4_general_ci DEFAULT 'participating',
  `progress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `points_earned` int DEFAULT '0',
  `college_points_earned` int DEFAULT '0',
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int NOT NULL,
  `college_id` int NOT NULL,
  `user_id` int NOT NULL,
  `message_type` enum('text','photo','gif','poll') COLLATE utf8mb4_general_ci DEFAULT 'text',
  `content` text COLLATE utf8mb4_general_ci NOT NULL,
  `media_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `poll_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_pinned` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reply_to_id` int DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `college_id`, `user_id`, `message_type`, `content`, `media_url`, `poll_data`, `is_pinned`, `created_at`, `reply_to_id`, `is_deleted`, `updated_at`) VALUES
(1, 1, 1, 'text', 'Hello, this is a test message!', NULL, NULL, 0, '2025-08-29 09:59:38', NULL, 0, '2025-08-29 09:59:38'),
(2, 2, 2, 'text', 'hii', NULL, NULL, 0, '2025-08-29 10:05:12', NULL, 0, '2025-08-29 10:05:12'),
(3, 2, 3, 'text', 'how are you?', NULL, NULL, 0, '2025-08-29 10:13:55', NULL, 0, '2025-08-29 10:13:55'),
(4, 2, 2, 'text', 'hii', NULL, NULL, 0, '2025-08-30 15:32:19', NULL, 0, '2025-08-30 15:32:19'),
(5, 2, 2, 'text', 'hii', NULL, NULL, 0, '2025-08-30 18:10:49', NULL, 0, '2025-08-30 18:10:49'),
(6, 2, 2, 'text', 'hii', NULL, NULL, 0, '2025-08-30 18:43:20', NULL, 0, '2025-08-30 18:43:20'),
(7, 2, 2, 'text', 'hello', NULL, NULL, 0, '2025-08-30 18:43:29', 6, 0, '2025-08-30 18:43:29'),
(8, 2, 2, 'text', 'Hiii', NULL, NULL, 0, '2025-08-30 18:46:12', NULL, 0, '2025-08-30 18:46:12');

-- --------------------------------------------------------

--
-- Table structure for table `chat_reactions`
--

CREATE TABLE `chat_reactions` (
  `id` int NOT NULL,
  `message_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reaction_type` enum('like','love','laugh','wow','sad','angry') COLLATE utf8mb4_unicode_ci DEFAULT 'like',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_rooms`
--

CREATE TABLE `chat_rooms` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `college_id` int NOT NULL,
  `room_type` enum('college','group','private') COLLATE utf8mb4_unicode_ci DEFAULT 'college',
  `created_by` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_room_members`
--

CREATE TABLE `chat_room_members` (
  `id` int NOT NULL,
  `room_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('member','admin','moderator') COLLATE utf8mb4_unicode_ci DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_typing_indicators`
--

CREATE TABLE `chat_typing_indicators` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `college_id` int NOT NULL,
  `room_id` int DEFAULT NULL,
  `is_typing` tinyint(1) DEFAULT '0',
  `last_typing_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_typing_indicators`
--

INSERT INTO `chat_typing_indicators` (`id`, `user_id`, `college_id`, `room_id`, `is_typing`, `last_typing_at`) VALUES
(9, 1, 1, NULL, 0, '2025-08-29 10:00:01');

-- --------------------------------------------------------

--
-- Table structure for table `colleges`
--

CREATE TABLE `colleges` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `country` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'India',
  `logo_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `total_points` int DEFAULT '0',
  `ranking` int DEFAULT '0',
  `member_count` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `colleges`
--

INSERT INTO `colleges` (`id`, `name`, `city`, `state`, `country`, `logo_url`, `description`, `total_points`, `ranking`, `member_count`, `created_at`, `updated_at`) VALUES
(1, 'Cotton University', 'Guwahati', 'Assam', 'India', 'https://example.com/cotton-logo.png', 'Premier university in Assam', 0, 0, 0, '2025-08-29 09:56:46', '2025-08-29 09:56:46'),
(2, 'Gauhati University', 'Guwahati', 'Assam', 'India', 'https://example.com/gu-logo.png', 'Leading university in Northeast India', 100, 0, 2, '2025-08-29 09:56:46', '2025-08-29 10:07:17'),
(3, 'Tezpur University', 'Tezpur', 'Assam', 'India', 'https://example.com/tu-logo.png', 'Central University in Assam', 0, 0, 0, '2025-08-29 09:56:46', '2025-08-29 09:56:46'),
(4, 'IIT Guwahati', 'Guwahati', 'Assam', 'India', 'https://example.com/iitg-logo.png', 'Premier engineering institute', 0, 0, 0, '2025-08-29 09:56:46', '2025-08-29 09:56:46'),
(5, 'NIT Silchar', 'Silchar', 'Assam', 'India', 'https://example.com/nits-logo.png', 'National Institute of Technology', 0, 0, 0, '2025-08-29 09:56:46', '2025-08-29 09:56:46');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int NOT NULL,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_general_ci NOT NULL,
  `likes_count` int DEFAULT '0',
  `points_earned` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comment_likes`
--

CREATE TABLE `comment_likes` (
  `id` int NOT NULL,
  `comment_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `games`
--

CREATE TABLE `games` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('ludo','bgmi','freefire','valorant','quiz','coding','creative') COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('waiting','active','completed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'waiting',
  `college1_id` int NOT NULL,
  `college2_id` int NOT NULL,
  `winner_college_id` int DEFAULT NULL,
  `max_players` int DEFAULT '2',
  `current_players` int DEFAULT '0',
  `game_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `points_at_stake` int DEFAULT '100',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table `game_participants`
--

CREATE TABLE `game_participants` (
  `id` int NOT NULL,
  `game_id` int NOT NULL,
  `user_id` int NOT NULL,
  `college_id` int NOT NULL,
  `team_number` int NOT NULL,
  `player_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `points_earned` int DEFAULT '0',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

-- --------------------------------------------------------

--
-- Table structure for table `ludo_rooms`
--

CREATE TABLE `ludo_rooms` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `creator_id` int NOT NULL,
  `status` enum('waiting','playing','completed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'waiting',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `winner_id` int DEFAULT NULL,
  `game_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ;

-- --------------------------------------------------------

--
-- Table structure for table `points_history`
--

CREATE TABLE `points_history` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `college_id` int NOT NULL,
  `action_type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `points_earned` int NOT NULL,
  `college_points_earned` int NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `points_history`
--

INSERT INTO `points_history` (`id`, `user_id`, `college_id`, `action_type`, `points_earned`, `college_points_earned`, `description`, `reference_id`, `reference_type`, `created_at`) VALUES
(1, 2, 2, 'first_post_challenge', 50, 50, 'First post challenge completed', NULL, NULL, '2025-08-29 10:04:43'),
(2, 3, 2, 'first_post_challenge', 50, 50, 'First post challenge completed', NULL, NULL, '2025-08-29 10:07:17');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `college_id` int NOT NULL,
  `type` enum('photo','video','text','poll','story','live') COLLATE utf8mb4_general_ci NOT NULL,
  `content` text COLLATE utf8mb4_general_ci,
  `media_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `poll_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `poll_votes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `visibility` enum('public','college_only','private') COLLATE utf8mb4_general_ci DEFAULT 'public',
  `likes_count` int DEFAULT '0',
  `love_count` int DEFAULT '0',
  `laugh_count` int DEFAULT '0',
  `fire_count` int DEFAULT '0',
  `clap_count` int DEFAULT '0',
  `wow_count` int DEFAULT '0',
  `sad_count` int DEFAULT '0',
  `angry_count` int DEFAULT '0',
  `comments_count` int DEFAULT '0',
  `shares_count` int DEFAULT '0',
  `points_earned` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `user_id`, `college_id`, `type`, `content`, `media_urls`, `poll_options`, `poll_votes`, `visibility`, `likes_count`, `love_count`, `laugh_count`, `fire_count`, `clap_count`, `wow_count`, `sad_count`, `angry_count`, `comments_count`, `shares_count`, `points_earned`, `is_active`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'text', 'Hello everyone! This is my first post on AxomClash. Excited to be part of this community! 🎉', '[]', NULL, NULL, 'college_only', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 1, NULL, '2025-08-29 10:03:35', '2025-08-29 10:03:35'),
(2, 2, 2, 'photo', '', '[\"https://res.cloudinary.com/ddjsd5hqu/image/upload/v1756563303/axomclash/posts/media-1756461901027-945035941.png\"]', 'null', NULL, 'public', 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, NULL, '2025-08-29 10:05:01', '2025-08-30 14:15:04'),
(3, 3, 2, 'photo', '', '[\"https://res.cloudinary.com/ddjsd5hqu/image/upload/v1756563304/axomclash/posts/media-1756462619574-315542372.jpg\"]', 'null', NULL, 'public', 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, NULL, '2025-08-29 10:16:59', '2025-08-30 18:45:38');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `college_id` int NOT NULL,
  `question_id` int NOT NULL,
  `selected_answer` int NOT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `points_earned` int DEFAULT '0',
  `time_spent` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `difficulty` enum('easy','medium','hard') COLLATE utf8mb4_general_ci DEFAULT 'medium',
  `question` text COLLATE utf8mb4_general_ci NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `correct_answer` int NOT NULL,
  `explanation` text COLLATE utf8mb4_general_ci,
  `points` int DEFAULT '10',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`id`, `category`, `difficulty`, `question`, `options`, `correct_answer`, `explanation`, `points`, `created_at`) VALUES
(1, 'General Knowledge', 'easy', 'What is the capital of Assam?', '[\"Guwahati\",\"Dispur\",\"Jorhat\",\"Tezpur\"]', 1, 'Dispur is the capital of Assam', 10, '2025-08-29 09:56:46'),
(2, 'General Knowledge', 'easy', 'Which river flows through Guwahati?', '[\"Ganga\",\"Brahmaputra\",\"Yamuna\",\"Godavari\"]', 1, 'Brahmaputra flows through Guwahati', 10, '2025-08-29 09:56:46'),
(3, 'Technology', 'medium', 'What does HTML stand for?', '[\"Hyper Text Markup Language\",\"High Tech Modern Language\",\"Home Tool Markup Language\",\"Hyperlink and Text Markup Language\"]', 0, 'HTML stands for Hyper Text Markup Language', 15, '2025-08-29 09:56:46'),
(4, 'Technology', 'medium', 'Which programming language is known as the \"language of the web\"?', '[\"Java\",\"Python\",\"JavaScript\",\"C++\"]', 2, 'JavaScript is the language of the web', 15, '2025-08-29 09:56:46'),
(5, 'Sports', 'easy', 'Which sport is known as the \"gentleman\'s game\"?', '[\"Football\",\"Cricket\",\"Tennis\",\"Golf\"]', 1, 'Cricket is known as the gentleman\'s game', 10, '2025-08-29 09:56:46'),
(6, 'Entertainment', 'medium', 'Who directed the movie \"Baahubali\"?', '[\"Rajamouli\",\"Shankar\",\"Mani Ratnam\",\"Gautham Menon\"]', 0, 'Rajamouli directed Baahubali', 15, '2025-08-29 09:56:46'),
(7, 'Science', 'medium', 'What is the chemical symbol for gold?', '[\"Ag\",\"Au\",\"Fe\",\"Cu\"]', 1, 'Au is the chemical symbol for gold', 15, '2025-08-29 09:56:46'),
(8, 'History', 'easy', 'In which year did India gain independence?', '[\"1945\",\"1947\",\"1950\",\"1942\"]', 1, 'India gained independence in 1947', 10, '2025-08-29 09:56:46');

-- --------------------------------------------------------

--
-- Table structure for table `reactions`
--

CREATE TABLE `reactions` (
  `id` int NOT NULL,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reaction_type` enum('love','laugh','fire','clap','wow','sad','angry') COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reactions`
--

INSERT INTO `reactions` (`id`, `post_id`, `user_id`, `reaction_type`, `created_at`) VALUES
(1, 2, 2, 'laugh', '2025-08-29 10:05:04'),
(2, 2, 3, 'laugh', '2025-08-29 10:07:21'),
(3, 3, 3, 'love', '2025-08-29 10:17:04'),
(5, 3, 2, 'fire', '2025-08-30 18:45:37');

-- --------------------------------------------------------

--
-- Table structure for table `room_players`
--

CREATE TABLE `room_players` (
  `id` int NOT NULL,
  `room_id` int NOT NULL,
  `user_id` int NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_ready` tinyint(1) DEFAULT '0',
  `player_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ;

-- --------------------------------------------------------

--
-- Table structure for table `saved_posts`
--

CREATE TABLE `saved_posts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `post_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `saved_posts`
--

INSERT INTO `saved_posts` (`id`, `user_id`, `post_id`, `created_at`) VALUES
(1, 3, 2, '2025-08-29 10:13:35');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `profile_picture` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cover_photo` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `college_id` int NOT NULL,
  `student_status` enum('Currently Studying','Alumni') COLLATE utf8mb4_general_ci NOT NULL,
  `bio` text COLLATE utf8mb4_general_ci,
  `total_points` int DEFAULT '0',
  `reputation_score` int DEFAULT '0',
  `daily_streak` int DEFAULT '0',
  `last_login` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_online` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `full_name`, `email`, `password_hash`, `profile_picture`, `cover_photo`, `college_id`, `student_status`, `bio`, `total_points`, `reputation_score`, `daily_streak`, `last_login`, `is_online`, `created_at`, `updated_at`) VALUES
(1, 'testuser', 'Test User', 'test@example.com', '$2a$12$AsuOy7osfZiG.ypzmgTYeuWxkN2J1VYvqlTNx78Y.VjQ7CTF4P5s.', NULL, NULL, 1, '', NULL, 0, 0, 0, '2025-08-29 09:58:51', 0, '2025-08-29 09:58:33', '2025-08-29 10:04:16'),
(2, 'sagar', 'sagar', 'spbaruah13@gmail.com', '$2a$12$jnqHSl/NqQf.XWDUjKhCDuyg1Pf3OVeIaz3VaqbqXF5L2UzxB6cXO', 'https://res.cloudinary.com/ddjsd5hqu/image/upload/v1756576854/axomclash/profiles/lwaci4ym6g8mjli1aaxs.jpg', 'https://res.cloudinary.com/ddjsd5hqu/image/upload/v1756576820/axomclash/covers/cz4fkx4lwmvdslew27bc.jpg', 2, 'Alumni', NULL, 50, 0, 0, '2025-08-30 18:45:12', 1, '2025-08-29 10:04:43', '2025-08-30 18:45:12'),
(3, 'shibani saikia', 'shibani saikia', 'spbaruah15@gmail.com', '$2a$12$hk3QpSJPLm9jxS2uA3bToemRV9sUxDsD9Iyo8bkNblFCt.605FL9i', 'https://res.cloudinary.com/ddjsd5hqu/image/upload/v1756563305/axomclash/profiles/avatar-1756462699532-947080270.png', 'https://res.cloudinary.com/ddjsd5hqu/image/upload/v1756563311/axomclash/covers/cover-1756462687859-509271079.jpg', 2, 'Alumni', NULL, 50, 0, 0, '2025-08-29 10:16:32', 0, '2025-08-29 10:07:17', '2025-08-30 14:15:12');

-- --------------------------------------------------------

--
-- Table structure for table `user_blocks`
--

CREATE TABLE `user_blocks` (
  `id` int NOT NULL,
  `blocker_id` int NOT NULL,
  `blocked_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_blocks`
--

INSERT INTO `user_blocks` (`id`, `blocker_id`, `blocked_id`, `created_at`) VALUES
(1, 2, 3, '2025-08-30 18:47:12');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `session_token` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `device_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_order` (`display_order`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

--
-- Indexes for table `challenge_participants`
--
ALTER TABLE `challenge_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant` (`challenge_id`,`user_id`),
  ADD KEY `college_id` (`college_id`),
  ADD KEY `idx_challenge` (`challenge_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_college` (`college_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `chat_reactions`
--
ALTER TABLE `chat_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_message_user_reaction` (`message_id`,`user_id`,`reaction_type`),
  ADD KEY `idx_message_id` (`message_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_reaction_type` (`reaction_type`);

--
-- Indexes for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_college_id` (`college_id`),
  ADD KEY `idx_room_type` (`room_type`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `chat_room_members`
--
ALTER TABLE `chat_room_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_room_user` (`room_id`,`user_id`),
  ADD KEY `idx_room_id` (`room_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `chat_typing_indicators`
--
ALTER TABLE `chat_typing_indicators`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_college_id` (`college_id`),
  ADD KEY `idx_room_id` (`room_id`),
  ADD KEY `idx_is_typing` (`is_typing`);

--
-- Indexes for table `colleges`
--
ALTER TABLE `colleges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_city` (`city`),
  ADD KEY `idx_points` (`total_points`),
  ADD KEY `idx_ranking` (`ranking`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_post` (`post_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_parent` (`parent_id`);

--
-- Indexes for table `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_comment_like` (`comment_id`,`user_id`),
  ADD KEY `idx_comment` (`comment_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `games`
--
ALTER TABLE `games`
  ADD PRIMARY KEY (`id`),
  ADD KEY `winner_college_id` (`winner_college_id`),
  ADD KEY `idx_college1` (`college1_id`),
  ADD KEY `idx_college2` (`college2_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `game_participants`
--
ALTER TABLE `game_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant` (`game_id`,`user_id`),
  ADD KEY `idx_game` (`game_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_college` (`college_id`);

--
-- Indexes for table `ludo_rooms`
--
ALTER TABLE `ludo_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_creator` (`creator_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `points_history`
--
ALTER TABLE `points_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_college` (`college_id`),
  ADD KEY `idx_action` (`action_type`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_college` (`college_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_visibility` (`visibility`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_college` (`college_id`),
  ADD KEY `idx_question` (`question_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_difficulty` (`difficulty`);

--
-- Indexes for table `reactions`
--
ALTER TABLE `reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_reaction` (`post_id`,`user_id`),
  ADD KEY `idx_post` (`post_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `room_players`
--
ALTER TABLE `room_players`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_room_player` (`room_id`,`user_id`),
  ADD KEY `idx_room` (`room_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `saved_posts`
--
ALTER TABLE `saved_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_saved_post` (`user_id`,`post_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_post` (`post_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_college` (`college_id`),
  ADD KEY `idx_points` (`total_points`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_student_status` (`student_status`);

--
-- Indexes for table `user_blocks`
--
ALTER TABLE `user_blocks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_block` (`blocker_id`,`blocked_id`),
  ADD KEY `idx_blocker` (`blocker_id`),
  ADD KEY `idx_blocked` (`blocked_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_token` (`session_token`),
  ADD KEY `idx_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `challenge_participants`
--
ALTER TABLE `challenge_participants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_reactions`
--
ALTER TABLE `chat_reactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_room_members`
--
ALTER TABLE `chat_room_members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_typing_indicators`
--
ALTER TABLE `chat_typing_indicators`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `colleges`
--
ALTER TABLE `colleges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `comment_likes`
--
ALTER TABLE `comment_likes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `games`
--
ALTER TABLE `games`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_participants`
--
ALTER TABLE `game_participants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ludo_rooms`
--
ALTER TABLE `ludo_rooms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `points_history`
--
ALTER TABLE `points_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reactions`
--
ALTER TABLE `reactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `room_players`
--
ALTER TABLE `room_players`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `saved_posts`
--
ALTER TABLE `saved_posts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_blocks`
--
ALTER TABLE `user_blocks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `challenge_participants`
--
ALTER TABLE `challenge_participants`
  ADD CONSTRAINT `challenge_participants_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `challenge_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `challenge_participants_ibfk_3` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_reactions`
--
ALTER TABLE `chat_reactions`
  ADD CONSTRAINT `chat_reactions_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD CONSTRAINT `chat_rooms_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_rooms_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_room_members`
--
ALTER TABLE `chat_room_members`
  ADD CONSTRAINT `chat_room_members_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_room_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_typing_indicators`
--
ALTER TABLE `chat_typing_indicators`
  ADD CONSTRAINT `chat_typing_indicators_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_typing_indicators_ibfk_2` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_typing_indicators_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD CONSTRAINT `comment_likes_ibfk_1` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comment_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `games`
--
ALTER TABLE `games`
  ADD CONSTRAINT `games_ibfk_1` FOREIGN KEY (`college1_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `games_ibfk_2` FOREIGN KEY (`college2_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `games_ibfk_3` FOREIGN KEY (`winner_college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_participants`
--
ALTER TABLE `game_participants`
  ADD CONSTRAINT `game_participants_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_participants_ibfk_3` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ludo_rooms`
--
ALTER TABLE `ludo_rooms`
  ADD CONSTRAINT `ludo_rooms_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ludo_rooms_ibfk_2` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `points_history`
--
ALTER TABLE `points_history`
  ADD CONSTRAINT `points_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `points_history_ibfk_2` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_attempts_ibfk_3` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reactions`
--
ALTER TABLE `reactions`
  ADD CONSTRAINT `reactions_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_players`
--
ALTER TABLE `room_players`
  ADD CONSTRAINT `room_players_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `ludo_rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_players_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_posts`
--
ALTER TABLE `saved_posts`
  ADD CONSTRAINT `saved_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_posts_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_blocks`
--
ALTER TABLE `user_blocks`
  ADD CONSTRAINT `user_blocks_ibfk_1` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_blocks_ibfk_2` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
