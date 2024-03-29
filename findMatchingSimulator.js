/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * Takes in a parsed simulator list and a desired name, and returns an object with the matching simulator. The desired
 * name can optionally include the iOS version in between parenthesis after the device name. Ex: "iPhone 6 (9.2)" in
 * which case it'll attempt to find a simulator with the exact version specified.
 *
 * If the simulatorString argument is null, we'll go into default mode and return the currently booted simulator, or if
 * none is booted, it will be the first in the list.
 *
 * @param Object simulators a parsed list from `xcrun simctl list --json devices` command
 * @param String|null simulatorString the string with the name of desired simulator. If null, it will use the currently
 *        booted simulator, or if none are booted, the first in the list.
 * @returns {Object} {udid, name, version}
 */
function findMatchingSimulator(simulators, simulatorString) {
  if (!simulators.devices) {
    return null;
  }
  const devices = simulators.devices;

  const parsedSimulatorName = simulatorString ? simulatorString.match(/(.*)? (?:\((.*)?\))?/) : [];
  if (parsedSimulatorName[2] !== undefined) {
    var simulatorVersion = parsedSimulatorName[2];
    var simulatorName = parsedSimulatorName[1];
  } else {
    simulatorName = simulatorString;
  }

  var match;
  for (let version in devices) {
    // Making sure the version of the simulator is an iOS or tvOS (Removes Apple Watch, etc)
    // if (!version.startsWith('iOS') && !version.startsWith('tvOS')) {
    if (!version.startsWith('com.apple.CoreSimulator.SimRuntime.iOS') && !version.startsWith('com.apple.CoreSimulator.SimRuntime.tvOS')) {
      continue;
    }
    if (simulatorVersion && !version.endsWith(simulatorVersion)) {
      continue;
    }
    for (let i in devices[version]) {
      let simulator = devices[version][i];
      // Skipping non-available simulator
      if (
        simulator.availability !== '(available)' &&
        simulator.isAvailable !== 'YES' &&
        simulator.isAvailable !== true
      ) {
        continue;
      }
      let booted = simulator.state === 'Booted';
      if (booted && simulatorName === null) {
        return {
          udid: simulator.udid,
          name: simulator.name,
          booted,
          version,
        };
      }
      if (simulator.name === simulatorName && !match) {
        match = {
          udid: simulator.udid,
          name: simulator.name,
          booted,
          version,
        };
      }
      // Keeps track of the first available simulator for use if we can't find one above.
      if (simulatorName === null && !match) {
        match = {
          udid: simulator.udid,
          name: simulator.name,
          booted,
          version,
        };
      }
    }
  }
  if (match) {
    return match;
  }
  return null;
}

module.exports = findMatchingSimulator;
