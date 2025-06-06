-- MySQL dump 10.13  Distrib 8.0.42, for macos15.2 (arm64)
--
-- Host: localhost    Database: laquiniela247
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('ad572071-03f9-49c7-a973-e03b062c48c0','73be4b44f9c4fbd8d4483d2da8fb3aa071dbd4ea637e0be6027a281c9f94153c','2025-06-04 15:03:36.019','20250603200130_init',NULL,NULL,'2025-06-04 15:03:35.860',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bets`
--

DROP TABLE IF EXISTS `bets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `week_id` int NOT NULL,
  `game_id` int NOT NULL,
  `prediction` enum('home','draw','away') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bets_user_id_game_id_key` (`user_id`,`game_id`),
  KEY `bets_user_id_week_id_idx` (`user_id`,`week_id`),
  KEY `bets_game_id_idx` (`game_id`),
  KEY `bets_week_id_fkey` (`week_id`),
  CONSTRAINT `bets_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `bets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `bets_week_id_fkey` FOREIGN KEY (`week_id`) REFERENCES `weeks` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bets`
--

LOCK TABLES `bets` WRITE;
/*!40000 ALTER TABLE `bets` DISABLE KEYS */;
/*!40000 ALTER TABLE `bets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `id` int NOT NULL AUTO_INCREMENT,
  `week_number` int NOT NULL,
  `home_team_id` int NOT NULL,
  `away_team_id` int NOT NULL,
  `match_date` datetime(3) NOT NULL,
  `status` enum('scheduled','live','finished') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `home_score` int DEFAULT NULL,
  `away_score` int DEFAULT NULL,
  `result` enum('home','draw','away') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `games_week_number_idx` (`week_number`),
  KEY `games_match_date_idx` (`match_date`),
  KEY `games_status_idx` (`status`),
  KEY `games_home_team_id_fkey` (`home_team_id`),
  KEY `games_away_team_id_fkey` (`away_team_id`),
  CONSTRAINT `games_away_team_id_fkey` FOREIGN KEY (`away_team_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `games_home_team_id_fkey` FOREIGN KEY (`home_team_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `games_week_number_fkey` FOREIGN KEY (`week_number`) REFERENCES `weeks` (`week_number`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `games`
--

LOCK TABLES `games` WRITE;
/*!40000 ALTER TABLE `games` DISABLE KEYS */;
INSERT INTO `games` VALUES (31,15,1,4,'2025-06-06 23:00:00.000','scheduled',NULL,NULL,NULL,'2025-06-05 20:45:12.154'),(32,15,4,11,'2025-06-06 23:00:00.000','scheduled',NULL,NULL,NULL,'2025-06-05 20:57:26.175'),(33,15,8,12,'2025-06-06 19:00:00.000','scheduled',NULL,NULL,NULL,'2025-06-05 21:05:11.157');
/*!40000 ALTER TABLE `games` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `league` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Liga MX',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (1,'Club Necaxa','NEC','https://www.laquiniela247.mx/wp-content/uploads/2025/04/NECAXA.png','Liga MX','2025-06-04 15:03:37.658'),(2,'Querétaro FC','QRO','https://www.laquiniela247.mx/wp-content/uploads/2025/04/QUERETARO-2.png','Liga MX','2025-06-04 15:03:37.661'),(3,'Mazatlán FC','MAZ','https://www.laquiniela247.mx/wp-content/uploads/2025/04/MAZATLAN.png','Liga MX','2025-06-04 15:03:37.663'),(4,'Atlas FC','ATL','https://www.laquiniela247.mx/wp-content/uploads/2025/04/ATLAS-1.png','Liga MX','2025-06-04 15:03:37.665'),(5,'Club América','AME','https://www.laquiniela247.mx/wp-content/uploads/2025/04/AMERICA.png','Liga MX','2025-06-04 15:03:37.667'),(6,'Chivas Guadalajara','CHI','https://www.laquiniela247.mx/wp-content/uploads/2025/04/CHIVAS.png','Liga MX','2025-06-04 15:03:37.669'),(7,'Cruz Azul','CAZ','https://www.laquiniela247.mx/wp-content/uploads/2025/04/CRUZAZUL.png','Liga MX','2025-06-04 15:03:37.670'),(8,'Pumas UNAM','PUM','https://www.laquiniela247.mx/wp-content/uploads/2025/04/PUMAS.png','Liga MX','2025-06-04 15:03:37.672'),(9,'Tigres UANL','TIG','https://www.laquiniela247.mx/wp-content/uploads/2025/04/TIGRES.png','Liga MX','2025-06-04 15:03:37.673'),(10,'Monterrey','MTY','https://www.laquiniela247.mx/wp-content/uploads/2025/04/MONTERREY.png','Liga MX','2025-06-04 15:03:37.674'),(11,'Santos Laguna','SAN','https://www.laquiniela247.mx/wp-content/uploads/2025/04/SANTOS.png','Liga MX','2025-06-04 15:03:37.676'),(12,'León FC','LEO','https://www.laquiniela247.mx/wp-content/uploads/2025/04/LEON.png','Liga MX','2025-06-04 15:03:37.677'),(13,'Pachuca','PAC','https://www.laquiniela247.mx/wp-content/uploads/2025/04/PACHUCA.png','Liga MX','2025-06-04 15:03:37.678'),(14,'Toluca FC','TOL','https://www.laquiniela247.mx/wp-content/uploads/2025/04/TOLUCA.png','Liga MX','2025-06-04 15:03:37.679'),(15,'Puebla FC','PUE','https://www.laquiniela247.mx/wp-content/uploads/2025/04/PUEBLA.png','Liga MX','2025-06-04 15:03:37.681'),(16,'FC Juárez','JUA','https://www.laquiniela247.mx/wp-content/uploads/2025/04/JUAREZ.png','Liga MX','2025-06-04 15:03:37.682'),(17,'Tijuana','TIJ','https://www.laquiniela247.mx/wp-content/uploads/2025/04/TIJUANA.png','Liga MX','2025-06-04 15:03:37.683'),(18,'Atlético San Luis','ASL','https://www.laquiniela247.mx/wp-content/uploads/2025/04/SANLUIS.png','Liga MX','2025-06-04 15:03:37.685');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `week_id` int DEFAULT NULL,
  `type` enum('entry_fee','winnings','refund') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MXN',
  `status` enum('pending','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'demo',
  `transaction_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transactions_user_id_idx` (`user_id`),
  KEY `transactions_week_id_idx` (`week_id`),
  KEY `transactions_status_idx` (`status`),
  CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `transactions_week_id_fkey` FOREIGN KEY (`week_id`) REFERENCES `weeks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_performance`
--

DROP TABLE IF EXISTS `user_performance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_performance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `week_id` int NOT NULL,
  `total_predictions` int NOT NULL DEFAULT '0',
  `correct_predictions` int NOT NULL DEFAULT '0',
  `percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `ranking_position` int DEFAULT NULL,
  `percentile` decimal(5,2) DEFAULT NULL,
  `winnings` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','calculated') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_performance_user_id_week_id_key` (`user_id`,`week_id`),
  KEY `user_performance_week_id_ranking_position_idx` (`week_id`,`ranking_position`),
  CONSTRAINT `user_performance_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `user_performance_week_id_fkey` FOREIGN KEY (`week_id`) REFERENCES `weeks` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_performance`
--

LOCK TABLES `user_performance` WRITE;
/*!40000 ALTER TABLE `user_performance` DISABLE KEYS */;
INSERT INTO `user_performance` VALUES (1,1,1,6,3,50.00,11,50.00,600.00,'calculated','2025-06-04 15:03:42.354','2025-06-04 15:03:42.354'),(2,2,1,6,3,50.00,17,50.00,600.00,'calculated','2025-06-04 15:03:42.361','2025-06-04 15:03:42.361'),(3,1,2,6,3,50.00,15,50.00,600.00,'calculated','2025-06-04 15:03:42.379','2025-06-04 15:03:42.379'),(4,2,2,6,3,50.00,13,50.00,600.00,'calculated','2025-06-04 15:03:42.385','2025-06-04 15:03:42.385'),(5,1,3,6,3,50.00,5,50.00,600.00,'calculated','2025-06-04 15:03:42.402','2025-06-04 15:03:42.402'),(6,2,3,6,3,50.00,6,50.00,600.00,'calculated','2025-06-04 15:03:42.409','2025-06-04 15:03:42.409'),(7,1,4,6,3,50.00,14,50.00,600.00,'calculated','2025-06-04 15:03:42.426','2025-06-04 15:03:42.426'),(8,2,4,6,3,50.00,14,50.00,600.00,'calculated','2025-06-04 15:03:42.433','2025-06-04 15:03:42.433'),(9,1,5,6,0,0.00,14,0.00,0.00,'pending','2025-06-04 15:03:42.450','2025-06-04 15:03:42.450'),(10,2,5,6,0,0.00,3,0.00,0.00,'pending','2025-06-04 15:03:42.455','2025-06-04 15:03:42.455');
/*!40000 ALTER TABLE `user_performance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `total_bets` int NOT NULL DEFAULT '0',
  `total_correct` int NOT NULL DEFAULT '0',
  `overall_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `total_winnings` decimal(10,2) NOT NULL DEFAULT '0.00',
  `best_week_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `best_ranking_position` int DEFAULT NULL,
  `favorite_team_id` int DEFAULT NULL,
  `preferred_language` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'es',
  `email_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_profiles_user_id_key` (`user_id`),
  KEY `user_profiles_favorite_team_id_fkey` (`favorite_team_id`),
  CONSTRAINT `user_profiles_favorite_team_id_fkey` FOREIGN KEY (`favorite_team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (1,1,30,12,40.00,2400.00,100.00,1,5,'es',1,'2025-06-04 15:03:37.997','2025-06-04 15:03:42.459'),(2,2,30,12,40.00,2400.00,100.00,1,NULL,'es',1,'2025-06-04 15:03:38.275','2025-06-04 15:03:42.462');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` datetime(3) DEFAULT NULL,
  `last_login_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'demo@laquiniela247.mx','$2a$12$..ZtJ/cVLdFw0hV0H4tHxOeFGGYt4qw0OS3KQ4mEY.N6HcNT7r2su','Demo','User','user',1,1,'2025-06-04 15:03:37.988','2025-06-05 16:02:49.263','2025-06-04 15:03:37.994','2025-06-05 16:02:49.264'),(2,'admin@laquiniela247.mx','$2a$12$qPrAaX3g2KKtxtV0Ibr5numWvqzW9bwJ7v8e.12KP8ADuET9H1Gga','Admin','User','admin',1,1,'2025-06-04 15:03:38.272','2025-06-05 21:57:37.467','2025-06-04 15:03:38.273','2025-06-05 21:57:37.468');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weeks`
--

DROP TABLE IF EXISTS `weeks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weeks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `week_number` int NOT NULL,
  `season` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) NOT NULL,
  `betting_deadline` datetime(3) NOT NULL,
  `status` enum('upcoming','open','closed','finished') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `weeks_week_number_key` (`week_number`),
  UNIQUE KEY `weeks_week_number_season_key` (`week_number`,`season`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weeks`
--

LOCK TABLES `weeks` WRITE;
/*!40000 ALTER TABLE `weeks` DISABLE KEYS */;
INSERT INTO `weeks` VALUES (1,95,'2025','2025-05-05 07:00:00.000','2025-05-12 06:59:59.000','2025-05-07 07:00:00.000','finished','2025-06-04 15:03:42.325'),(2,96,'2025','2025-05-12 07:00:00.000','2025-05-19 06:59:59.000','2025-05-14 07:00:00.000','finished','2025-06-04 15:03:42.362'),(3,97,'2025','2025-05-19 07:00:00.000','2025-05-26 06:59:59.000','2025-05-21 07:00:00.000','finished','2025-06-04 15:03:42.386'),(4,98,'2025','2025-05-26 07:00:00.000','2025-06-02 06:59:59.000','2025-05-28 07:00:00.000','finished','2025-06-04 15:03:42.410'),(5,99,'2025','2025-06-04 16:03:42.433','2025-06-11 16:03:41.433','2025-06-05 15:03:42.433','open','2025-06-04 15:03:42.434'),(6,25,'2025','2025-06-16 07:00:00.000','2025-06-22 07:00:00.000','2025-06-18 07:00:00.000','upcoming','2025-06-05 20:07:11.941'),(7,24,'2025','2025-06-09 07:00:00.000','2025-06-15 07:00:00.000','2025-06-11 07:00:00.000','upcoming','2025-06-05 20:20:59.017'),(8,15,'2025','2025-06-05 23:00:00.000','2025-06-07 23:00:00.000','2025-06-06 21:00:00.000','upcoming','2025-06-05 20:45:12.002');
/*!40000 ALTER TABLE `weeks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-05 16:32:45
