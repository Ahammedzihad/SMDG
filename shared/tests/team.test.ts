import { describe, expect, it } from 'vitest';
import {
  ROLE_EDITABLE_CATEGORIES,
  SHARED_DECISION_TYPES,
  TEAM_ROLE_INFO,
  TEAM_ROLES,
  canRoleEditCategory,
  checkRoleAuthorization,
  getRoleEditableCategories,
  getRoleForCategory,
  isPartCategory,
  isTeamRole,
  resolveProposalVote,
  resolveVotes
} from '../src/index.js';
import type { PartCategory, TeamPlayer, TeamRole, VoteResolutionParams } from '../src/index.js';

describe('ORBITONE Team Roles & Authorization', () => {
  it('defines exactly the four required team roles', () => {
    expect(TEAM_ROLES).toEqual([
      'mission_planner',
      'spacecraft_engineer',
      'science_lead',
      'comms_budget_officer'
    ]);
  });

  it('correctly maps spacecraft categories each role may edit', () => {
    // Mission Planner owns mission parameters, no spacecraft part categories
    expect(ROLE_EDITABLE_CATEGORIES.mission_planner).toEqual([]);

    // Spacecraft Engineer owns structure, power, battery, computer, attitude control (adcs)
    expect(ROLE_EDITABLE_CATEGORIES.spacecraft_engineer).toEqual([
      'structure',
      'power',
      'battery',
      'computer',
      'adcs'
    ]);

    // Science Lead owns instruments
    expect(ROLE_EDITABLE_CATEGORIES.science_lead).toEqual(['instrument']);

    // Comms and Budget Officer owns comms
    expect(ROLE_EDITABLE_CATEGORIES.comms_budget_officer).toEqual(['comms']);
  });

  it('covers all 7 PartCategory items disjointly with no overlap', () => {
    const allAssignedCategories: PartCategory[] = [
      ...ROLE_EDITABLE_CATEGORIES.mission_planner,
      ...ROLE_EDITABLE_CATEGORIES.spacecraft_engineer,
      ...ROLE_EDITABLE_CATEGORIES.science_lead,
      ...ROLE_EDITABLE_CATEGORIES.comms_budget_officer
    ];

    expect(allAssignedCategories).toHaveLength(7);
    const uniqueAssigned = new Set(allAssignedCategories);
    expect(uniqueAssigned.size).toBe(7);

    const expectedAll: PartCategory[] = [
      'structure',
      'power',
      'battery',
      'comms',
      'computer',
      'adcs',
      'instrument'
    ];
    for (const cat of expectedAll) {
      expect(uniqueAssigned.has(cat)).toBe(true);
      expect(getRoleForCategory(cat)).not.toBeNull();
    }
  });

  it('validates roles and categories via type guards', () => {
    expect(isTeamRole('mission_planner')).toBe(true);
    expect(isTeamRole('spacecraft_engineer')).toBe(true);
    expect(isTeamRole('science_lead')).toBe(true);
    expect(isTeamRole('comms_budget_officer')).toBe(true);
    expect(isTeamRole('flight_director')).toBe(false);
    expect(isTeamRole(null)).toBe(false);

    expect(isPartCategory('structure')).toBe(true);
    expect(isPartCategory('instrument')).toBe(true);
    expect(isPartCategory('warp_drive')).toBe(false);
  });

  describe('Authorization checks (canRoleEditCategory and checkRoleAuthorization)', () => {
    it('authorizes Spacecraft Engineer for engineering subsystems', () => {
      const engineerCats: PartCategory[] = ['structure', 'power', 'battery', 'computer', 'adcs'];
      for (const cat of engineerCats) {
        expect(canRoleEditCategory('spacecraft_engineer', cat)).toBe(true);
        const check = checkRoleAuthorization('spacecraft_engineer', cat);
        expect(check.authorized).toBe(true);
        expect(check.reason).toContain('authorized');
      }

      // Spacecraft Engineer cannot edit instruments or comms
      expect(canRoleEditCategory('spacecraft_engineer', 'instrument')).toBe(false);
      expect(canRoleEditCategory('spacecraft_engineer', 'comms')).toBe(false);
      const checkInst = checkRoleAuthorization('spacecraft_engineer', 'instrument');
      expect(checkInst.authorized).toBe(false);
      expect(checkInst.reason).toContain('Science Lead');
    });

    it('authorizes Science Lead only for instrument parts', () => {
      expect(canRoleEditCategory('science_lead', 'instrument')).toBe(true);
      expect(canRoleEditCategory('science_lead', 'structure')).toBe(false);
      expect(canRoleEditCategory('science_lead', 'power')).toBe(false);
      expect(canRoleEditCategory('science_lead', 'comms')).toBe(false);
    });

    it('authorizes Comms and Budget Officer only for comms parts', () => {
      expect(canRoleEditCategory('comms_budget_officer', 'comms')).toBe(true);
      expect(canRoleEditCategory('comms_budget_officer', 'structure')).toBe(false);
      expect(canRoleEditCategory('comms_budget_officer', 'instrument')).toBe(false);
    });

    it('Mission Planner cannot edit physical spacecraft part categories', () => {
      const allCats: PartCategory[] = [
        'structure',
        'power',
        'battery',
        'comms',
        'computer',
        'adcs',
        'instrument'
      ];
      for (const cat of allCats) {
        expect(canRoleEditCategory('mission_planner', cat)).toBe(false);
        const check = checkRoleAuthorization('mission_planner', cat);
        expect(check.authorized).toBe(false);
      }
    });

    it('gracefully rejects invalid roles or categories with clear reasons', () => {
      const invalidRole = checkRoleAuthorization('invalid_role', 'structure');
      expect(invalidRole.authorized).toBe(false);
      expect(invalidRole.reason).toContain('Invalid role');

      const invalidCat = checkRoleAuthorization('spacecraft_engineer', 'nuclear_reactor');
      expect(invalidCat.authorized).toBe(false);
      expect(invalidCat.reason).toContain('Invalid spacecraft category');
    });
  });
});

describe('ORBITONE Shared Decision Voting Resolver', () => {
  const standard2Players: TeamPlayer[] = [
    { id: 'p1', role: 'mission_planner', name: 'Alice' },
    { id: 'p2', role: 'spacecraft_engineer', name: 'Bob' }
  ];

  const standard3Players: TeamPlayer[] = [
    { id: 'p1', role: 'mission_planner' },
    { id: 'p2', role: 'spacecraft_engineer' },
    { id: 'p3', role: 'science_lead' }
  ];

  const standard4Players: TeamPlayer[] = [
    { id: 'p1', role: 'mission_planner' },
    { id: 'p2', role: 'spacecraft_engineer' },
    { id: 'p3', role: 'science_lead' },
    { id: 'p4', role: 'comms_budget_officer' }
  ];

  describe('Two-player team voting: both must agree', () => {
    it('passes when both players agree on the same choice', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard2Players,
        votes: [
          { playerId: 'p1', choice: 'sso' },
          { playerId: 'p2', choice: 'sso' }
        ]
      });

      expect(result.status).toBe('passed');
      expect(result.passed).toBe(true);
      expect(result.winner).toBe('sso');
      expect(result.majorityThreshold).toBe(2);
      expect(result.missingPlayerIds).toHaveLength(0);
      expect(result.reason).toContain('all 2 players agreed');
    });

    it('fails when two players split their votes (disagreement)', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard2Players,
        votes: [
          { playerId: 'p1', choice: 'sso' },
          { playerId: 'p2', choice: 'leo' }
        ]
      });

      expect(result.status).toBe('tie');
      expect(result.passed).toBe(false);
      expect(result.winner).toBeNull();
      expect(result.reason).toContain('both players must agree');
    });

    it('returns missing_votes when only one player has voted in a 2-player team', () => {
      const result = resolveVotes({
        decision: 'launch_vehicle',
        players: standard2Players,
        votes: [{ playerId: 'p1', choice: 'rideshare_dispenser' }]
      });

      expect(result.status).toBe('missing_votes');
      expect(result.passed).toBe(false);
      expect(result.winner).toBeNull();
      expect(result.missingPlayerIds).toEqual(['p2']);
      expect(result.reason).toContain('awaiting votes');
    });
  });

  describe('Three-player team voting: majority wins (> 50%, 2 of 3)', () => {
    it('passes when 2 of 3 players vote for the same option', () => {
      const result = resolveVotes({
        decision: 'objective',
        players: standard3Players,
        votes: [
          { playerId: 'p1', choice: 'earth_observation' },
          { playerId: 'p2', choice: 'earth_observation' },
          { playerId: 'p3', choice: 'space_weather' }
        ]
      });

      expect(result.status).toBe('passed');
      expect(result.passed).toBe(true);
      expect(result.winner).toBe('earth_observation');
      expect(result.majorityThreshold).toBe(2);
      expect(result.reason).toContain('majority of 2 of 3 votes');
    });

    it('passes unanimously when all 3 players agree', () => {
      const result = resolveVotes({
        decision: 'objective',
        players: standard3Players,
        votes: {
          p1: 'space_weather',
          p2: 'space_weather',
          p3: 'space_weather'
        }
      });

      expect(result.status).toBe('passed');
      expect(result.passed).toBe(true);
      expect(result.winner).toBe('space_weather');
      expect(result.reason).toContain('passed unanimously');
    });

    it('returns a 3-way tie when all 3 players vote differently', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard3Players,
        votes: [
          { playerId: 'p1', choice: 'leo' },
          { playerId: 'p2', choice: 'sso' },
          { playerId: 'p3', choice: 'geo' }
        ]
      });

      expect(result.status).toBe('tie');
      expect(result.passed).toBe(false);
      expect(result.winner).toBeNull();
      expect(result.reason).toContain('tied');
    });

    it('returns missing_votes when only 1 vote is cast in 3-player team', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard3Players,
        votes: [{ playerId: 'p1', choice: 'leo' }]
      });

      expect(result.status).toBe('missing_votes');
      expect(result.passed).toBe(false);
      expect(result.missingPlayerIds).toEqual(['p2', 'p3']);
    });

    it('respects requireAllVotes option when early majority is present', () => {
      // 2 votes for 'sso' out of 3 total players
      const params: VoteResolutionParams = {
        decision: 'orbit',
        players: standard3Players,
        votes: [
          { playerId: 'p1', choice: 'sso' },
          { playerId: 'p2', choice: 'sso' }
        ]
      };

      // By default without requireAllVotes, 2 of 3 is a secure majority
      const defaultRes = resolveVotes(params);
      expect(defaultRes.status).toBe('passed');
      expect(defaultRes.winner).toBe('sso');
      expect(defaultRes.missingPlayerIds).toEqual(['p3']);

      // When requireAllVotes is true, it waits for all ballots
      const strictRes = resolveVotes({
        ...params,
        options: { requireAllVotes: true }
      });
      expect(strictRes.status).toBe('missing_votes');
      expect(strictRes.passed).toBe(false);
      expect(strictRes.missingPlayerIds).toEqual(['p3']);
    });
  });

  describe('Four-player team voting: majority wins (> 50%, 3 of 4)', () => {
    it('passes when 3 of 4 players vote for the same option', () => {
      const result = resolveVotes({
        decision: 'final_launch',
        players: standard4Players,
        votes: [
          { playerId: 'p1', choice: 'launch' },
          { playerId: 'p2', choice: 'launch' },
          { playerId: 'p3', choice: 'launch' },
          { playerId: 'p4', choice: 'hold' }
        ]
      });

      expect(result.status).toBe('passed');
      expect(result.passed).toBe(true);
      expect(result.winner).toBe('launch');
      expect(result.majorityThreshold).toBe(3);
    });

    it('results in tie on a 2-2 split in 4-player team', () => {
      const result = resolveVotes({
        decision: 'final_launch',
        players: standard4Players,
        votes: [
          { playerId: 'p1', choice: 'launch' },
          { playerId: 'p2', choice: 'launch' },
          { playerId: 'p3', choice: 'hold' },
          { playerId: 'p4', choice: 'hold' }
        ]
      });

      expect(result.status).toBe('tie');
      expect(result.passed).toBe(false);
      expect(result.winner).toBeNull();
      expect(result.tallies[0].votes).toBe(2);
      expect(result.tallies[1].votes).toBe(2);
    });

    it('returns no_majority on a 2-1-1 split in 4-player team', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard4Players,
        votes: [
          { playerId: 'p1', choice: 'sso' },
          { playerId: 'p2', choice: 'sso' },
          { playerId: 'p3', choice: 'leo' },
          { playerId: 'p4', choice: 'geo' }
        ]
      });

      expect(result.status).toBe('no_majority');
      expect(result.passed).toBe(false);
      expect(result.winner).toBeNull();
      expect(result.reason).toContain('failed to reach a majority');
      expect(result.reason).toContain('3 votes are required');
    });

    it('returns missing_votes when 2 vote for A and 2 players have not voted yet', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard4Players,
        votes: [
          { playerId: 'p1', choice: 'sso' },
          { playerId: 'p2', choice: 'sso' }
        ]
      });

      // 2 votes in a 4-player team is not an unassailable majority
      expect(result.status).toBe('missing_votes');
      expect(result.passed).toBe(false);
      expect(result.missingPlayerIds).toEqual(['p3', 'p4']);
    });
  });

  describe('Solo mode / single player', () => {
    it('passes with 1 player and 1 vote', () => {
      const result = resolveVotes({
        decision: 'objective',
        players: [{ id: 'solo_p1', role: 'mission_planner' }],
        votes: [{ playerId: 'solo_p1', choice: 'earth_observation' }]
      });

      expect(result.status).toBe('passed');
      expect(result.passed).toBe(true);
      expect(result.winner).toBe('earth_observation');
    });
  });

  describe('Invalid player and role data handling', () => {
    it('returns status invalid when players array is empty or not an array', () => {
      const emptyRes = resolveVotes({
        decision: 'orbit',
        players: [],
        votes: []
      });
      expect(emptyRes.status).toBe('invalid');
      expect(emptyRes.passed).toBe(false);
      expect(emptyRes.playerErrors.length).toBeGreaterThan(0);

      const nullPlayersRes = resolveVotes({
        decision: 'orbit',
        players: null as any,
        votes: []
      });
      expect(nullPlayersRes.status).toBe('invalid');
    });

    it('returns status invalid when decision identifier is empty', () => {
      const result = resolveVotes({
        decision: '',
        players: standard2Players,
        votes: []
      });
      expect(result.status).toBe('invalid');
      expect(result.playerErrors.some((e) => e.field === 'decision')).toBe(true);
    });

    it('detects duplicate player IDs', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: [
          { id: 'p1', role: 'mission_planner' },
          { id: 'p1', role: 'spacecraft_engineer' }
        ],
        votes: []
      });

      expect(result.status).toBe('invalid');
      expect(result.playerErrors.some((e) => e.reason.includes('Duplicate player ID'))).toBe(true);
    });

    it('detects invalid role strings', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: [
          { id: 'p1', role: 'flight_surgeon' as any },
          { id: 'p2', role: 'spacecraft_engineer' }
        ],
        votes: []
      });

      expect(result.status).toBe('invalid');
      expect(result.playerErrors.some((e) => e.field === 'role' && e.reason.includes('Invalid role'))).toBe(true);
    });

    it('detects duplicate roles in team mode', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: [
          { id: 'p1', role: 'mission_planner' },
          { id: 'p2', role: 'mission_planner' }
        ],
        votes: []
      });

      expect(result.status).toBe('invalid');
      expect(result.playerErrors.some((e) => e.reason.includes('Duplicate role'))).toBe(true);
    });
  });

  describe('Invalid votes handling', () => {
    it('records invalid votes from unauthorized / unknown voters', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard2Players,
        votes: [
          { playerId: 'p1', choice: 'sso' },
          { playerId: 'intruder', choice: 'sso' }
        ]
      });

      expect(result.invalidVotes).toHaveLength(1);
      expect(result.invalidVotes[0].playerId).toBe('intruder');
      expect(result.invalidVotes[0].reason).toContain('not in the eligible team');
      // p2 vote is still missing
      expect(result.status).toBe('missing_votes');
      expect(result.missingPlayerIds).toEqual(['p2']);
    });

    it('records duplicate votes from the same player as invalid', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard2Players,
        votes: [
          { playerId: 'p1', choice: 'sso' },
          { playerId: 'p1', choice: 'leo' },
          { playerId: 'p2', choice: 'sso' }
        ]
      });

      expect(result.invalidVotes).toHaveLength(1);
      expect(result.invalidVotes[0].playerId).toBe('p1');
      expect(result.invalidVotes[0].reason).toContain('Duplicate vote');
      // The first vote was 'sso', p2 voted 'sso' -> unanimous agreement!
      expect(result.status).toBe('passed');
      expect(result.winner).toBe('sso');
    });

    it('records votes with empty or invalid choices', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard2Players,
        votes: [
          { playerId: 'p1', choice: '' },
          { playerId: 'p2', choice: 'sso' }
        ]
      });

      expect(result.invalidVotes).toHaveLength(1);
      expect(result.invalidVotes[0].reason).toContain('empty or invalid choice');
    });

    it('validates choices against allowedChoices option when provided', () => {
      const result = resolveVotes({
        decision: 'orbit',
        players: standard2Players,
        votes: [
          { playerId: 'p1', choice: 'deep_space' }, // not an allowed choice
          { playerId: 'p2', choice: 'sso' }
        ],
        options: {
          allowedChoices: ['leo', 'sso', 'geo']
        }
      });

      expect(result.invalidVotes).toHaveLength(1);
      expect(result.invalidVotes[0].choice).toBe('deep_space');
      expect(result.invalidVotes[0].reason).toContain('not in the allowed choices list');
    });
  });

  describe('resolveProposalVote helper and function overloads', () => {
    it('supports binary proposal votes with approve / reject booleans', () => {
      const result = resolveProposalVote('final_launch', standard2Players, [
        { playerId: 'p1', approve: true },
        { playerId: 'p2', approve: true }
      ]);

      expect(result.status).toBe('passed');
      expect(result.winner).toBe('approve');
      expect(result.passed).toBe(true);
    });

    it('handles positional arguments signature: resolveVotes(decision, players, votes)', () => {
      const result = resolveVotes('orbit', ['p1', 'p2', 'p3'], {
        p1: 'sso',
        p2: 'sso',
        p3: 'leo'
      });

      expect(result.status).toBe('passed');
      expect(result.winner).toBe('sso');
      expect(result.validVotesCount).toBe(3);
    });

    it('is completely deterministic: same input produces identical output', () => {
      const params: VoteResolutionParams = {
        decision: 'orbit',
        players: standard3Players,
        votes: [
          { playerId: 'p1', choice: 'sso' },
          { playerId: 'p2', choice: 'sso' },
          { playerId: 'p3', choice: 'leo' }
        ]
      };

      const res1 = resolveVotes(params);
      const res2 = resolveVotes(params);
      expect(res1).toEqual(res2);
    });
  });
});
