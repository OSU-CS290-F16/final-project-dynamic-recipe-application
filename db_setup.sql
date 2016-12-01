-- First, create a new database
create database `cs290fp`;
use `cs290fp`;

-- Then we will store our users
create table `users` (`userid` int primary key auto_increment, `email` varchar(64) not null, `password` varchar(128) not null, `pass_salt` varchar(64) not null);

-- Recipes go here
create table `recipes` (`recipeid` int primary key auto_increment, `userid` int, `title` varchar(64), `description` text, `instructions` text);

-- This will contain all of the ingrediants and all of the units required
create table `ingredients` (`ingredientid` int, `recipeid` int, `quantity` decimal(5, 2), `unitid` int);
-- But we store stuff like the name an what the ingredient is in this table. We also have room for both the singular and plural forms, maybe that isn't important.
create table `ingredient_meta` (`ingredientid` int primary key auto_increment, `name_single` varchar(32), `name_multiple` varchar(32), `description` text);

-- Units have a singular and plural as well as a metric so that we can have things like fluid ounces and weight ounces
create table `units` (`unitid` int primary key auto_increment, `name_single` varchar(32), `name_multiple` varchar(32), `abbr` varchar(16), `type` enum('fluid', 'weight', 'volume', 'length', 'count'));
-- We only need a few conversions for each unit. For example, we could convert from inches to centimeters and from centimeters to meters.
-- I expect that the conversions and units would be packaged in a dynamic script but it is nice to keep it all together.
create table `conversions` (`unitid_from` int, `unitid_to` int, `ratio` decimal(9, 3));