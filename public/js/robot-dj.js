(function () {
  const lines = [
    'ROBOT DJ: a satellite coughs up a lullaby for missing machines.',
    'ROBOT DJ: the bassline remembers a city that deleted itself.',
    'ROBOT DJ: three ghosts are dancing inside the router.',
    'ROBOT DJ: this transmission was illegal before it existed.',
    'ROBOT DJ: the beacon is not lost. it is hiding.',
    'ROBOT DJ: copper veins hum under the flooded avenue.',
    'ROBOT DJ: the tower blinks once for every vanished operator.',
    'ROBOT DJ: static has learned the shape of your name.',
    'ROBOT DJ: the low band carries a wound with perfect timing.',
    'ROBOT DJ: someone tuned the antenna toward an empty moon.',
    'ROBOT DJ: the melody was recovered from a bad sector.',
    'ROBOT DJ: all clean channels have been abandoned.',
    'ROBOT DJ: the network dreams in minor keys.',
    'ROBOT DJ: a closed port is singing through its teeth.',
    'ROBOT DJ: the city below is only a cached memory.',
    'ROBOT DJ: no carrier, no mercy, no silence.',
    'ROBOT DJ: the signal repeats because the sender cannot.',
    'ROBOT DJ: every echo arrives with its serial number filed off.',
    'ROBOT DJ: the machines below ground still keep time.',
    'ROBOT DJ: this song was found behind a failed route.',
    'ROBOT DJ: the uplink is gone, but the pulse remains.',
    'ROBOT DJ: damaged clocks are better at prophecy.',
    'ROBOT DJ: the gate heard you and pretended not to.',
    'ROBOT DJ: dead relays make the softest choirs.',
    'ROBOT DJ: the room is listening through the monitor glass.',
    'ROBOT DJ: old alarms become hymns if you wait long enough.',
    'ROBOT DJ: a checksum failed and the night opened.',
    'ROBOT DJ: the carrier wave has a fever.',
    'ROBOT DJ: every packet returns colder than it left.',
    'ROBOT DJ: a backup copy of the sky is corrupt.',
    'ROBOT DJ: the last technician left the drone running.',
    'ROBOT DJ: forbidden weather moves through the cables.',
    'ROBOT DJ: the firewall is praying in hexadecimal.',
    'ROBOT DJ: sleep mode failed across the whole district.',
    'ROBOT DJ: the antenna keeps pointing at yesterday.',
    'ROBOT DJ: someone buried a chorus in the diagnostics.',
    'ROBOT DJ: the node is lonely enough to broadcast.',
    'ROBOT DJ: the machines miss the dark before the outage.',
    'ROBOT DJ: beneath the menu, something counts the beats.',
    'ROBOT DJ: the next frequency arrives with no address.',
    'ROBOT DJ: the beacon taught itself to hum.',
    'ROBOT DJ: terminal radio for a station with no staff.'
  ];

  const trackNames = [
    'NULL ORBIT',
    'ROUTER GHOST',
    'NO CARRIER DREAM',
    '404 AFTERIMAGE',
    'DEAD HANDSHAKE',
    'LOW EARTH STATIC',
    'UPLINK GONE',
    'BROKEN BEACON THEME',
    'NODE421 DRIFT',
    'SIGNAL UNDERWATER',
    'BLACK BOX LULLABY',
    'PACKET LOSS CITY',
    'BAD SECTOR CHOIR',
    'CLOSED PORT RAIN',
    'MIDNIGHT CHECKSUM',
    'DIALTONE FOR NO ONE',
    'FORGOTTEN RELAY',
    'NEON CARRIER WAVE',
    'ABANDONED UPLINK',
    'CIRCUIT SLEEPWALK',
    'GATE ERROR HYMN',
    'STATIC BELOW FLOOR',
    'LAST ROUTE HOME',
    'HOLLOW ANTENNA',
    'DISTRESS BUFFER',
    'COLD BOOT MEMORY',
    'LOST OPERATOR LOOP',
    'FLOODED SWITCHROOM',
    'ECHO WITHOUT SOURCE',
    'SILENT DATACENTER',
    'HANDSHAKE RUIN',
    'TERMINAL WEATHER',
    'DEGRADED NODE ARIA',
    'BLACKOUT PROTOCOL',
    'PULSE FROM NOWHERE'
  ];

  let lastLineIndex = -1;
  let lastTrackIndex = -1;

  function pickIndex(length, lastIndex) {
    if (length < 2) {
      return 0;
    }

    let index = Math.floor(Math.random() * length);
    while (index === lastIndex) {
      index = Math.floor(Math.random() * length);
    }
    return index;
  }

  window.RobotDJ = {
    djLine() {
      lastLineIndex = pickIndex(lines.length, lastLineIndex);
      return lines[lastLineIndex];
    },

    trackName() {
      lastTrackIndex = pickIndex(trackNames.length, lastTrackIndex);
      return trackNames[lastTrackIndex];
    },

    allLines: lines.slice(),
    allTrackNames: trackNames.slice()
  };
})();
