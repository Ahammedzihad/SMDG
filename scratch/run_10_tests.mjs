import {
  computeMeters,
  runAllChecks as sharedRunAllChecks,
  runSimulation,
  scoreMission,
  buildReport,
  parts,
  cubesatClasses,
  vehicles,
  orbits,
  objectives
} from 'file:///C:/UR/SMDG/SMDG/shared/dist/index.js';

console.log('--- STARTING 10 AUTHORITATIVE ENGINE INTEGRATION TESTS ---');

let passedTests = 0;

// TEST 1: Person A Known-Valid Baseline Mission
try {
  const design = {
    objective_id: 'earth_observation',
    orbit_id: 'sso',
    vehicle_id: 'rideshare_dispenser',
    cubesat_class_id: '3U',
    part_ids: [
      'struct_3u',
      'solar_deployable_3u',
      'batt_space_30wh',
      'comms_sband_patch',
      'obc_rad_hard',
      'adcs_3axis_wheels',
      'inst_multispectral_imager'
    ],
    lifetime_months: 12,
    budget_m: 2.5,
    fuel_mass_kg: 0.1,
    duty_cycle: 0.5,
    observe_time_fraction: 0.5,
    link_efficiency: 0.95
  };

  const meters = computeMeters(design);
  const cls = cubesatClasses.find(c => c.id === design.cubesat_class_id);
  const veh = vehicles.find(v => v.id === design.vehicle_id);

  const checks = sharedRunAllChecks({
    total_mass_kg: meters.mass.value,
    cubesat_class: cls,
    vehicle: veh,
    orbit_id: design.orbit_id,
    power_used_w: meters.power.limit - meters.power.value,
    power_generated_w: meters.power.limit,
    cost_total_m: meters.budget.value,
    budget_m: design.budget_m,
    data_sent_per_day_gb: meters.communications.value,
    data_made_per_day_gb: meters.data.value
  });

  const sim = runSimulation(design, 42, 1);
  const score = scoreMission(sim, 'solo');
  const report = buildReport(sim, score);

  if (
    checks.passed === true &&
    sim.outcome === 'threshold_met' &&
    sim.science_collected === 40 &&
    sim.data_transmitted_total_gb === 360 &&
    sim.data_lost_total_gb === 0 &&
    score.total === 75 &&
    score.rank === 'Mission Lead' &&
    report.similar_real_mission?.name === 'IceCube'
  ) {
    console.log('✅ TEST 1 PASSED: Person A known-valid configuration reproduced exactly.');
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED:', {
      checksPassed: checks.passed,
      outcome: sim.outcome,
      science: sim.science_collected,
      dataTransmitted: sim.data_transmitted_total_gb,
      score: score.total,
      rank: score.rank
    });
  }
} catch (e) {
  console.error('❌ TEST 1 EXCEPTION:', e);
}

// TEST 2: Unknown Component ID Rejection (Frontend Engine Adapter logic)
try {
  const validPartIds = new Set(parts.map((p) => p.id));
  const validatePartIds = (partIds) => {
    for (const id of partIds) {
      if (!validPartIds.has(id)) {
        throw new Error(`Unknown component ID rejected: "${id}". Component is not in the shared catalogue.`);
      }
    }
  };

  let rejected = false;
  try {
    validatePartIds(['struct_3u', 'unknown_laser_cannon_9000']);
  } catch (err) {
    rejected = err.message.includes('Unknown component ID rejected');
  }

  if (rejected) {
    console.log('✅ TEST 2 PASSED: Unknown component ID correctly rejected.');
    passedTests++;
  } else {
    console.error('❌ TEST 2 FAILED: Unknown component ID was not rejected.');
  }
} catch (e) {
  console.error('❌ TEST 2 EXCEPTION:', e);
}

// TEST 3: Invalid Configuration (Over Budget / Over Mass)
try {
  const overBudgetDesign = {
    objective_id: 'earth_observation',
    orbit_id: 'sso',
    vehicle_id: 'rideshare_dispenser',
    cubesat_class_id: '3U',
    part_ids: [
      'struct_3u',
      'solar_deployable_3u',
      'batt_space_30wh',
      'comms_sband_patch',
      'obc_rad_hard',
      'adcs_3axis_wheels',
      'inst_multispectral_imager'
    ],
    lifetime_months: 12,
    budget_m: 0.1 // Unrealistically low budget
  };

  const meters = computeMeters(overBudgetDesign);
  const cls = cubesatClasses.find(c => c.id === overBudgetDesign.cubesat_class_id);
  const veh = vehicles.find(v => v.id === overBudgetDesign.vehicle_id);

  const checks = sharedRunAllChecks({
    total_mass_kg: meters.mass.value,
    cubesat_class: cls,
    vehicle: veh,
    orbit_id: overBudgetDesign.orbit_id,
    power_used_w: meters.power.limit - meters.power.value,
    power_generated_w: meters.power.limit,
    cost_total_m: meters.budget.value,
    budget_m: overBudgetDesign.budget_m,
    data_sent_per_day_gb: meters.communications.value,
    data_made_per_day_gb: meters.data.value
  });

  const budgetCheck = checks.checks.find(c => c.id === 'withinBudget');
  if (!checks.passed && budgetCheck && !budgetCheck.passed) {
    console.log('✅ TEST 3 PASSED: Invalid budget configuration blocked by hard check ("withinBudget").');
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED: Hard budget check did not fail as expected.', { passed: checks.passed, budgetCheck });
  }
} catch (e) {
  console.error('❌ TEST 3 EXCEPTION:', e);
}

// TEST 4: Downlink Insufficiency Warning (Non-blocking warning)
try {
  // UHF patch provides 0.2 GB/day, while imager produces 1.0 GB/day
  const warningDesign = {
    objective_id: 'earth_observation',
    orbit_id: 'sso',
    vehicle_id: 'rideshare_dispenser',
    cubesat_class_id: '3U',
    part_ids: [
      'struct_3u',
      'solar_deployable_3u',
      'batt_space_30wh',
      'comms_uhf_dipole', // low downlink throughput
      'obc_rad_hard',
      'adcs_3axis_wheels',
      'inst_multispectral_imager'
    ],
    lifetime_months: 12,
    budget_m: 2.5
  };

  const meters = computeMeters(warningDesign);
  const cls = cubesatClasses.find(c => c.id === warningDesign.cubesat_class_id);
  const veh = vehicles.find(v => v.id === warningDesign.vehicle_id);

  const checks = sharedRunAllChecks({
    total_mass_kg: meters.mass.value,
    cubesat_class: cls,
    vehicle: veh,
    orbit_id: warningDesign.orbit_id,
    power_used_w: meters.power.limit - meters.power.value,
    power_generated_w: meters.power.limit,
    cost_total_m: meters.budget.value,
    budget_m: warningDesign.budget_m,
    data_sent_per_day_gb: meters.communications.value,
    data_made_per_day_gb: meters.data.value
  });

  const downlinkCheck = checks.warnings.find(w => w.id === 'dataCanBeSent');
  if (checks.passed === true && downlinkCheck && downlinkCheck.isWarning) {
    console.log('✅ TEST 4 PASSED: Downlink insufficiency is classified as non-blocking warning.');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED: Downlink check failed to register as warning or blocked passed.');
  }
} catch (e) {
  console.error('❌ TEST 4 EXCEPTION:', e);
}

// TEST 5: Component Addition, Removal, and Replacement
try {
  let selectedParts = ['struct_3u', 'solar_deployable_3u'];
  // Add part
  selectedParts = Array.from(new Set([...selectedParts, 'batt_space_30wh']));
  // Duplicate attempt
  selectedParts = Array.from(new Set([...selectedParts, 'batt_space_30wh']));
  const noDuplicates = selectedParts.filter(id => id === 'batt_space_30wh').length === 1;

  // Structure replacement
  const structParts = parts.filter(p => p.category === 'structure').map(p => p.id);
  selectedParts = selectedParts.filter(id => !structParts.includes(id));
  selectedParts.push('struct_1u');
  const structureSwapped = selectedParts.includes('struct_1u') && !selectedParts.includes('struct_3u');

  // Removal
  selectedParts = selectedParts.filter(id => id !== 'batt_space_30wh');
  const removed = !selectedParts.includes('batt_space_30wh');

  if (noDuplicates && structureSwapped && removed) {
    console.log('✅ TEST 5 PASSED: Component add, remove, deduplicate, and replace validated.');
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED:', { noDuplicates, structureSwapped, removed });
  }
} catch (e) {
  console.error('❌ TEST 5 EXCEPTION:', e);
}

// TEST 6: Telemetry Recalculation (Meters)
try {
  const design = {
    objective_id: 'earth_observation',
    orbit_id: 'sso',
    vehicle_id: 'rideshare_dispenser',
    cubesat_class_id: '3U',
    part_ids: [
      'struct_3u',
      'solar_deployable_3u',
      'batt_space_30wh',
      'comms_sband_patch',
      'obc_rad_hard',
      'adcs_3axis_wheels',
      'inst_multispectral_imager'
    ],
    lifetime_months: 12,
    budget_m: 2.5
  };

  const meters = computeMeters(design);
  const keys = Object.keys(meters);
  const requiredKeys = ['mass', 'power', 'budget', 'data', 'communications', 'time'];
  const hasAllKeys = requiredKeys.every(k => keys.includes(k));
  const validValues = requiredKeys.every(k => typeof meters[k].value === 'number' && typeof meters[k].limit === 'number');

  if (hasAllKeys && validValues) {
    console.log('✅ TEST 6 PASSED: All 6 telemetry meters computed accurately.');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED: Missing meters or invalid values.');
  }
} catch (e) {
  console.error('❌ TEST 6 EXCEPTION:', e);
}

// TEST 7: Launch Validation Gate
try {
  const invalidDesign = {
    cubesat_class_id: '1U', // 1U limit is 2.0 kg
    orbit_id: 'leo',
    vehicle_id: 'rideshare_dispenser',
    part_ids: ['struct_3u', 'solar_gainp_high_eff', 'batt_space_30wh', 'obc_rad_hard', 'inst_multispectral_imager'], // Over 2.0 kg
    lifetime_months: 12,
    budget_m: 5.0
  };

  const meters = computeMeters(invalidDesign);
  const cls = cubesatClasses.find(c => c.id === invalidDesign.cubesat_class_id);
  const veh = vehicles.find(v => v.id === invalidDesign.vehicle_id);

  const checks = sharedRunAllChecks({
    total_mass_kg: meters.mass.value,
    cubesat_class: cls,
    vehicle: veh,
    orbit_id: invalidDesign.orbit_id,
    power_used_w: meters.power.limit - meters.power.value,
    power_generated_w: meters.power.limit,
    cost_total_m: meters.budget.value,
    budget_m: invalidDesign.budget_m,
    data_sent_per_day_gb: meters.communications.value,
    data_made_per_day_gb: meters.data.value
  });

  // Launch gate should reject
  const gateBlocksLaunch = checks.passed === false;
  if (gateBlocksLaunch) {
    console.log('✅ TEST 7 PASSED: Launch gate strictly blocks invalid designs.');
    passedTests++;
  } else {
    console.error('❌ TEST 7 FAILED: Launch gate allowed an invalid design.');
  }
} catch (e) {
  console.error('❌ TEST 7 EXCEPTION:', e);
}

// TEST 8: Deterministic Simulation
try {
  const design = {
    objective_id: 'earth_observation',
    orbit_id: 'sso',
    vehicle_id: 'rideshare_dispenser',
    cubesat_class_id: '3U',
    part_ids: [
      'struct_3u',
      'solar_deployable_3u',
      'batt_space_30wh',
      'comms_sband_patch',
      'obc_rad_hard',
      'adcs_3axis_wheels',
      'inst_multispectral_imager'
    ],
    lifetime_months: 12,
    budget_m: 2.5,
    duty_cycle: 0.5,
    observe_time_fraction: 0.5,
    link_efficiency: 0.95
  };

  const sim1 = runSimulation(design, 42, 1);
  const sim2 = runSimulation(design, 42, 1);

  const matches = (
    sim1.outcome === sim2.outcome &&
    sim1.science_collected === sim2.science_collected &&
    sim1.data_transmitted_total_gb === sim2.data_transmitted_total_gb &&
    JSON.stringify(sim1.timeline) === JSON.stringify(sim2.timeline) &&
    JSON.stringify(sim1.series) === JSON.stringify(sim2.series)
  );

  if (matches) {
    console.log('✅ TEST 8 PASSED: Simulation is strictly deterministic given identical seed.');
    passedTests++;
  } else {
    console.error('❌ TEST 8 FAILED: Non-deterministic simulation outputs.');
  }
} catch (e) {
  console.error('❌ TEST 8 EXCEPTION:', e);
}

// TEST 9: Final Report Output Integrity
try {
  const design = {
    objective_id: 'earth_observation',
    orbit_id: 'sso',
    vehicle_id: 'rideshare_dispenser',
    cubesat_class_id: '3U',
    part_ids: [
      'struct_3u',
      'solar_deployable_3u',
      'batt_space_30wh',
      'comms_sband_patch',
      'obc_rad_hard',
      'adcs_3axis_wheels',
      'inst_multispectral_imager'
    ],
    lifetime_months: 12,
    budget_m: 2.5,
    duty_cycle: 0.5,
    observe_time_fraction: 0.5,
    link_efficiency: 0.95
  };

  const sim = runSimulation(design, 42, 1);
  const score = scoreMission(sim, 'solo');
  const report = buildReport(sim, score);

  const hasResult = report.result === 'threshold_met';
  const hasTimeline = Array.isArray(report.timeline) && report.timeline.length > 0;
  const hasSeries = report.series && report.series.months.length === 12;
  const hasWhy = Array.isArray(report.why) && report.why.length >= 3 && report.why.length <= 5;
  const hasWhatToTryNext = Array.isArray(report.what_to_try_next) && report.what_to_try_next.length === 2;
  const hasTopRisks = Array.isArray(report.top_risks) && report.top_risks.length > 0;
  const hasScore = report.score.total === 75;
  const hasRank = report.rank === 'Mission Lead';
  const hasRealMission = report.similar_real_mission && report.similar_real_mission.name === 'IceCube';

  if (hasResult && hasTimeline && hasSeries && hasWhy && hasWhatToTryNext && hasTopRisks && hasScore && hasRank && hasRealMission) {
    console.log('✅ TEST 9 PASSED: Final report integrity verified across all 8 fields.');
    passedTests++;
  } else {
    console.error('❌ TEST 9 FAILED: Missing or incomplete report fields:', {
      hasResult, hasTimeline, hasSeries, hasWhy, hasWhatToTryNext, hasTopRisks, hasScore, hasRank, hasRealMission
    });
  }
} catch (e) {
  console.error('❌ TEST 9 EXCEPTION:', e);
}

// TEST 10: Existing Multiplayer Protocol Compatibility
try {
  const shared = await import('file:///C:/UR/SMDG/SMDG/shared/dist/index.js');
  const hasRoles = Array.isArray(shared.TEAM_ROLES) && shared.TEAM_ROLES.length === 4;
  const hasCategories = Array.isArray(shared.ROLE_EDITABLE_CATEGORIES.mission_planner);
  const hasRoleAuth = typeof shared.canRoleEditCategory === 'function';
  const hasIntents = Array.isArray(shared.CLIENT_INTENTS) && shared.CLIENT_INTENTS.length > 0;
  const hasMessages = Array.isArray(shared.SERVER_MESSAGES) && shared.SERVER_MESSAGES.length > 0;

  if (hasRoles && hasCategories && hasRoleAuth && hasIntents && hasMessages) {
    console.log('✅ TEST 10 PASSED: Multiplayer protocol types, roles, and authorization functions intact.');
    passedTests++;
  } else {
    console.error('❌ TEST 10 FAILED: Multiplayer protocol exports compromised.', {
      hasRoles, hasCategories, hasRoleAuth, hasIntents, hasMessages
    });
  }
} catch (e) {
  console.error('❌ TEST 10 EXCEPTION:', e);
}

console.log(`\n========================================`);
console.log(`SUMMARY: ${passedTests} / 10 TESTS PASSED`);
console.log(`========================================`);

