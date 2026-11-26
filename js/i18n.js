(function (global) {
  'use strict';

  global.SICIJU_I18N = {
    metaTitleActive: 'siciju.online — there is nothing here',
    metaTitleHidden: 'still empty, don’t worry — siciju.online',
    metaTitleReturned: 'back again? still nothing — siciju.online',

    statusEmpty: '204 EMPTY',
    statusLit: '200 LIT BUT EMPTY',
    timerTooltip: 'Time spent staring into the void',

    headlineDark: 'there is nothing here.',
    headlineLight: 'still nothing here, just brighter.',

    defaultNarrator: 'Seriously. Just the siciju.online domain and premium-grade silence.',
    returnNarrator: function (clicks) {
      return 'Oh, welcome back. Last time you clicked ' + clicks + ' times and still found nothing.';
    },

    btnCheck: 'check again, just in case',
    btnRestoreGravity: 'put it back please',
    btnRunaway: 'secret button!',
    btnRunawayCaught: 'caught thin air!',

    cordPullAria: 'Pull light cord',
    cordHintDark: 'pull',
    cordHintLight: 'off',
    lampToastOn: 'Lights on. Congrats, now the emptiness is even easier to see.',
    lampToastOff: 'Lights off. Pitch dark again. Relax, nobody stole the nothingness.',
    lampSpamToast: 'Hey, that is a light switch, not a gacha machine.',

    brandToast: '∅ siciju.online: 100% real domain, 0% content.',
    brandKnockToast: 'You knocked 3 times. A backstage doorway appeared in the bottom bar.',
    brandRestoredToast: 'Letters restored. Please stop dropping them.',
    konamiToast: 'Cheat code activated! Your reward: still nothing (+0 pts).',

    whisper1: 'why are you still sweeping around?',
    whisper2: 'nothing in this corner either',
    whisper3: 'pull the cord top-right if it is dark',
    whisper4: 'try clicking anywhere in the void',
    whisper5: '0 bytes of productivity located',
    whisper6: 'press / to open the secret shell',
    whisper7: 'seriously, go do something else',

    placardTag: 'WORK #000 · PERMANENT VOID COLLECTION',
    placardTitle: '"Nothingness (Untitled)"',
    placardArtist: 'siciju.online, 2026',
    placardMedium: 'Empty pixels, static HTML, and awkward silence on browser canvas.',
    placardValue: 'Estimated value: $0 (domain renewal fees not included)',
    rulerTopSuffix: 'of nothing',
    rulerSide: 'gallery space: 100% void',

    echoWords: ['nothing', 'breeze', '0x00', 'void', 'null', 'nope', '∅', 'zilch', 'empty'],

    scanStages: [
      { pct: 18, label: 'searching /assets directory...' },
      { pct: 46, label: 'checking for hidden articles...' },
      { pct: 77, label: 'weighing the database...' },
      { pct: 99, label: 'almost found something...' }
    ],
    scanCompleteStatus: 'RESULT: NOTHING (0.00 KB)',
    scanCompleteNarrator: 'See? Even 99% resolves to 0.00 KB. Told you nothing lives here.',

    runawayDodgeNarrator: 'Whoa, a stray button appeared. Catch it if you can.',
    runawayCaughtNarrator: 'Congrats! You caught a button full of... pure oxygen.',

    stepNarrator: function (step, ctx) {
      switch (step) {
        case 1:
          return 'Still empty. Nice click sound though, right?';
        case 2:
          return 'The button nudged a pixel. Content remains zero.';
        case 3:
          return 'This is basically opening the fridge repeatedly hoping snacks spawn.';
        case 6:
          return 'A single dust mote just drifted by. That is today’s major update.';
        case 7:
          return 'Millions of useful websites exist out there, yet here you are on siciju.online.';
        case 8:
          return 'Fine, here is the official inventory so you finally believe it.';
        case 9:
          return 'Great, you clicked so hard the headline lost gravity.';
        case 10:
          return 'Fun fact: the owner pays annual domain rent just to serve this sentence.';
        default:
          return [
            'You have spent ' + ctx.seconds + ' seconds and ' + ctx.clicks + ' clicks here. Impressive.',
            'Keep clicking and you will only unlock deeper layers of nothing.',
            'This page is 100% static: zero trackers, zero bloat, zero purpose.',
            'Try pulling the cord top-right or hitting / if you are still curious.'
          ][(step - 11) % 4];
      }
    },

    hudAchievements: 'finds',
    hudManifest: 'manifest',
    hudSoundOn: 'sound: on',
    hudSoundOff: 'sound: off',

    manifestEyebrow: 'OFFICIAL INVENTORY',
    manifestTitle: 'Void Manifest',
    manifestSubtitle: 'A completely transparent audit of every digital asset currently hosted on siciju.online.',
    manifestRows: function (data) {
      return [
        { key: 'Domain', val: 'siciju.online (real, paid for)', accent: false },
        { key: 'Main content', val: '[ empty ]', accent: true },
        { key: 'Blog & articles', val: '0 posts', accent: false },
        { key: 'Online store', val: 'closed before opening', accent: false },
        { key: 'Meaningful payload', val: '0.00 KB', accent: true },
        { key: 'Your pointless clicks', val: data.clicks + ' clicks', accent: false },
        { key: 'Time spent here', val: data.timeStr, accent: false },
        { key: 'Finds collected', val: data.achCount + ' / 5', accent: true }
      ];
    },
    downloadCertBtn: 'download certificate of nothingness (.txt)',

    achEyebrow: 'CURIOSITY LOG',
    achTitle: 'Finds in the Void',
    achSubtitle: 'We warned you there was nothing here, yet you kept poking around.',
    achCompleteText: 'Remarkable. You collected all 5 pieces of nothing. Claim your official certificate below.',
    achUnlockToast: function (title) {
      return 'New find: ' + title;
    },
    achievements: [
      {
        id: 'lamp',
        title: 'Void Illuminator',
        hint: 'Hint: this room actually has a light switch.',
        unlockedDesc: 'Turned on the lights just to verify the room is genuinely empty.'
      },
      {
        id: 'scan',
        title: 'Truth Seeker',
        hint: 'Hint: keep clicking the main button a few times.',
        unlockedDesc: 'Forced a deep scan up to 99% only to confirm 0.00 KB.'
      },
      {
        id: 'runaway',
        title: 'Button Wrangler',
        hint: 'Hint: poke the main button until something tries to flee.',
        unlockedDesc: 'Caught (or chased) the runaway button fleeing from reality.'
      },
      {
        id: 'terminal',
        title: 'Void Hacker',
        hint: 'Hint: there is a hidden shell at the bottom (or press /).',
        unlockedDesc: 'Opened siciju-sh and executed commands inside /dev/null.'
      },
      {
        id: 'collector',
        title: 'Air Collector',
        hint: 'Hint: inspect the manifest or claim your void proof.',
        unlockedDesc: 'Reviewed the official siciju.online Void Manifest.'
      }
    ],

    terminalWelcome: 'siciju-sh v0.0.0 — official shell for an empty directory. Type "help" for commands.',
    terminalPlaceholder: 'type help...',
    terminalHelp:
      'Available commands:\n' +
      '  help          show this help\n' +
      '  ls / ls -la   list contents of siciju.online\n' +
      '  cat .breeze   read hidden breeze file\n' +
      '  pwd           print current void path\n' +
      '  whoami        check visitor identity\n' +
      '  find          search for useful things\n' +
      '  ping          measure emptiness latency\n' +
      '  lamp          pull the lamp cord remotely\n' +
      '  play          step behind the curtain (3D)\n' +
      '  secret        reveal the grand secret\n' +
      '  sudo rm -rf / don’t even try\n' +
      '  clear / exit  clear or close shell',
    terminalUnknown: function (cmd) {
      return 'siciju-sh: "' + cmd + '" not found. Much like everything else here.';
    },
    terminalCommands: {
      ls: 'total 0\n(zero readable files)',
      lsLa: 'total 4\ndrwxr-xr-x  2 siciju  void    0 Nov 19 10:00 .\ndrwxr-xr-x  1 root    void    0 Nov 19 10:00 ..\ndrwx------  2 siciju  void    0 Nov 26 09:00 .backstage\n-rw-r--r--  1 siciju  void   42 Nov 19 10:00 .breeze\n-rw-r--r--  1 siciju  void    0 Nov 19 10:00 hopes.txt',
      catBreeze: 'whooooosh...\n(just a digital breeze passing through siciju.online.)',
      catHopes: '(0-byte file. utterly empty.)',
      pwd: '/dev/null/siciju.online',
      whoami: 'bored_visitor@siciju.online',
      find: './emptiness\n./void\n./nothing\nResult: 0 useful items found.',
      ping: 'PING siciju.online (127.0.0.0): 0 bytes of data.\n64 bytes from void: icmp_seq=1 ttl=64 time=0.00 ms (blazingly fast because nothing loads)',
      sudoRm: 'Permission denied. You cannot delete what was never there.',
      secret: 'The secret: the owner bought siciju.online before deciding what to build, so emptiness became the feature.',
      lampToggled: 'Toggled the lamp cord remotely. Look around.',
      enterPlay: 'Opening backstage hatch... shifting reality into 3 dimensions.'
    },

    certificateTemplate: function (data) {
      return [
        '+--------------------------------------------------------------+',
        '|               OFFICIAL CERTIFICATE OF NOTHING                |',
        '|                      siciju.online                           |',
        '+--------------------------------------------------------------+',
        '',
        'This certifies that the bearer of this text file knowingly',
        'visited siciju.online and lingered far longer than advised',
        'despite clear warnings that nothing exists here.',
        '',
        '  Visit Date      : ' + data.dateStr,
        '  Time Wasted     : ' + data.timeStr,
        '  Pointless Clicks: ' + data.clicks + ' clicks',
        '  Finds Collected : ' + data.achCount + ' / 5',
        '  Useful Payload  : 0.00 KB',
        '',
        'Statically signed without a backend by,',
        '∅ The Void of siciju.online',
        '+--------------------------------------------------------------+'
      ].join('\n');
    },

    consoleBanner:
      '%c ∅ siciju.online %c\n' +
      'Inspecting DevTools? Even the source code is just dedicated to proving nothing is here.\n' +
      'Since you made it this far: try clicking empty space or pressing / on the page.'
  };
})(window);
