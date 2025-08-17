/**
 * Test User Fixtures
 * Based on test requirements document
 */

export interface TestUser {
  email: string;
  password: string;
  team?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

export interface TestTeam {
  name: string;
  shareCode: string;
  passcode: string;
  fieldSize: number;
  mpr: number;
  roster: {
    total: number;
    striped: string[];
    injured: string[];
  };
}

// Primary test users
export const testUsers = {
  headCoach: {
    email: 'zackarychapple30+testcoach@gmail.com',
    password: 'GameDay2025!',
    team: 'Cobb Eagles (Test Team)',
    role: 'Head Coach',
    firstName: 'John',
    lastName: 'Coach'
  },
  
  assistantCoach: {
    email: 'zackarychapple30+testassistant@gmail.com',
    password: 'GameDay2025!',
    team: 'Cobb Eagles (Test Team)',
    role: 'Assistant Coach',
    firstName: 'Mike',
    lastName: 'Assistant'
  },
  
  secondaryCoach: {
    email: 'zackarychapple30+testcoach2@gmail.com',
    password: 'GameDay2025!',
    team: 'Cobb Falcons (Test Team 2)',
    role: 'Head Coach',
    firstName: 'Tom',
    lastName: 'Coach'
  },
  
  // Invalid users for negative testing
  invalidUser: {
    email: 'zackarychapple30+invalid@gmail.com',
    password: 'WrongPassword123!',
    firstName: 'Invalid',
    lastName: 'User'
  },
  
  // New user for signup testing
  newUser: {
    email: `test.${Date.now()}@footballtracker.app`,
    password: 'TestPass2025!',
    team: 'Test Team ' + Date.now(),
    role: 'Head Coach',
    firstName: 'New',
    lastName: 'Coach'
  }
} as const;

// Test teams
export const testTeams = {
  eagles: {
    name: 'Cobb Eagles',
    shareCode: 'EAGLES25',
    passcode: '1234',
    fieldSize: 80,
    mpr: 8,
    roster: {
      total: 22,
      striped: ['#7', '#15'],
      injured: ['#22']
    }
  },
  
  falcons: {
    name: 'Cobb Falcons',
    shareCode: 'FALCONS25',
    passcode: '5678',
    fieldSize: 40,
    mpr: 8,
    roster: {
      total: 15,
      striped: ['#3'],
      injured: []
    }
  }
} as const;

// Sample players for roster testing
export const samplePlayers = {
  offensive: [
    { number: 1, name: 'Jackson Smith', position: 'QB', striped: false },
    { number: 3, name: 'Marcus Johnson', position: 'RB', striped: true },
    { number: 5, name: 'Tyler Brown', position: 'RB', striped: false },
    { number: 11, name: 'Connor Wilson', position: 'WR', striped: false },
    { number: 14, name: 'Ethan Davis', position: 'WR', striped: false },
    { number: 21, name: 'Mason Miller', position: 'WR', striped: false },
    { number: 88, name: 'Noah Anderson', position: 'TE', striped: false }
  ],
  
  defensive: [
    { number: 7, name: 'Liam Taylor', position: 'DE', striped: true },
    { number: 24, name: 'Owen Thomas', position: 'LB', striped: false },
    { number: 32, name: 'Lucas White', position: 'LB', striped: false },
    { number: 44, name: 'Ryan Martinez', position: 'DL', striped: false },
    { number: 55, name: 'Blake Jackson', position: 'DL', striped: false },
    { number: 66, name: 'Carter Rodriguez', position: 'DL', striped: false },
    { number: 77, name: 'Dylan Lee', position: 'DE', striped: false }
  ],
  
  bench: [
    { number: 2, name: 'Backup QB', position: 'QB', striped: false },
    { number: 15, name: 'Aiden Harris', position: 'WR', striped: true },
    { number: 18, name: 'Hunter Clark', position: 'RB', striped: false },
    { number: 22, name: 'Jordan Lewis', position: 'LB', striped: false, injured: true },
    { number: 30, name: 'Cameron Allen', position: 'DB', striped: false },
    { number: 35, name: 'Austin Young', position: 'DB', striped: false },
    { number: 40, name: 'Nathan King', position: 'DL', striped: false }
  ]
};

// Test game scenarios
export const gameScenarios = {
  blowout: {
    name: 'The Blowout',
    description: 'Winning 35-0 at halftime, need to get all bench players to 8 plays',
    opponent: 'Test Opponent 1',
    homeScore: 35,
    awayScore: 0,
    quarter: 3,
    plays: 45,
    focus: 'MPR distribution'
  },
  
  nailBiter: {
    name: 'The Nail-Biter',
    description: 'Tied game in 4th quarter, starters need to play but must hit MPR',
    opponent: 'Test Opponent 2',
    homeScore: 21,
    awayScore: 21,
    quarter: 4,
    plays: 62,
    focus: 'Balance winning and MPR'
  },
  
  penaltyFest: {
    name: 'The Penalty Fest',
    description: 'Multiple penalties per quarter affecting play counts',
    opponent: 'Test Opponent 3',
    homeScore: 14,
    awayScore: 7,
    quarter: 2,
    plays: 28,
    penalties: 8,
    focus: 'Penalty tracking'
  },
  
  injuryGame: {
    name: 'The Injury Game',
    description: 'Player injured in Q2, must adjust MPR and lineups',
    opponent: 'Test Opponent 4',
    homeScore: 10,
    awayScore: 14,
    quarter: 2,
    plays: 24,
    injuredPlayer: 22,
    focus: 'Mid-game roster adjustment'
  }
};

// Helper function to get a test user by role
export function getUserByRole(role: 'head' | 'assistant' | 'new'): TestUser {
  switch (role) {
    case 'head':
      return testUsers.headCoach;
    case 'assistant':
      return testUsers.assistantCoach;
    case 'new':
      return { ...testUsers.newUser, email: `test.${Date.now()}@footballtracker.app` };
    default:
      return testUsers.headCoach;
  }
}

// Helper function to generate unique test data
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test.${timestamp}@footballtracker.app`,
    teamName: `Test Team ${timestamp}`,
    playerName: `Player ${timestamp}`,
    gameName: `Test Game ${timestamp}`
  };
}

export default {
  testUsers,
  testTeams,
  samplePlayers,
  gameScenarios,
  getUserByRole,
  generateTestData
};