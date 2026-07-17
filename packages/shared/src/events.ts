/** Event categories written to the EventLog (audit + future notifications). */
export enum EventType {
  ServerCreated = "ServerCreated",
  ServerDeleted = "ServerDeleted",
  StateTransition = "StateTransition",
  ConfigChanged = "ConfigChanged",
  InstallStarted = "InstallStarted",
  InstallProgress = "InstallProgress",
  InstallFinished = "InstallFinished",
  UpdateAvailable = "UpdateAvailable",
  ModUpdateAvailable = "ModUpdateAvailable",
  BackupCreated = "BackupCreated",
  RconCommand = "RconCommand",
  PlayerJoin = "PlayerJoin",
  PlayerLeave = "PlayerLeave",
  ScheduleFired = "ScheduleFired",
  Warning = "Warning",
  Error = "Error",
}

export interface AppEvent {
  id: string;
  type: EventType;
  serverId?: string | null;
  clusterId?: string | null;
  message: string;
  /** Arbitrary structured payload (state from/to, progress %, etc). */
  data?: Record<string, unknown> | null;
  createdAt: string; // ISO
}
