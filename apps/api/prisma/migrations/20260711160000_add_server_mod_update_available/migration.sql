-- Mod-update poller flag: an installed mod has a newer version available.
ALTER TABLE "Server" ADD COLUMN "modUpdateAvailable" BOOLEAN NOT NULL DEFAULT false;
