// ── DEMO SYNOPSES ──────────────────────────────────────────────────
const DEMO_S1 = `Aadu: Oru Bheekara Jeeviyanu (2015) is a cult Malayalam comedy that proves winning isn't everything—especially when your prize is a demonic nanny goat named Pinky. Shaji Pappan (Jayasurya), a "mass" leader of a struggling tug-of-war team in Idukki, wins a local tournament. Instead of cash, they get a goat. Due to a tragic backstory involving his wife eloping with his driver, Pappan hates females (even goats) and desperately wants to get rid of Pinky. What follows is a chaotic, non-stop comedy of errors. The motley crew of dimwits—including the cowardly self-proclaimed strongman Arakkal Abu—tries to dump the goat, but Pinky brings them nothing but bad luck, landing them in absurd situations. Simultaneously, an international smuggler called "Dude" (Vinayakan) is trying to locate a mythical, lucky herb called Neelakkoduveli. Through a series of hilariously bad decisions, Pappan's gang gets mixed up with Dude, a weirdly stylish police officer named Sarbath Shameer (Vijay Babu), and a local politician. Everyone thinks the gang has the Neelakkoduveli, leading to multiple showdowns where the gang is saved more by luck than skill. The peak of the madness involves a "ransom" video for the goat, a fight with ancient rifles that turn out to be duds, and a very confused Abu. In a final twist, the legendary herb is actually eaten by Pinky, who becomes a symbol of ultimate, albeit chaotic, luck. Shaji Pappan eventually tries to sell the goat, but a twist of fate—and his own sudden sympathy—leads to a, shall we say, "charming" conclusion involving the butcher's daughter. Aadu is a masterclass in nonsense, featuring high-energy, meme-worthy characters, witty fast-paced dialogue, and a total disregard for logic, making it a beloved cult classic in Kerala.`;

const DEMO_S2 = `The legendary (and mostly clueless) Shaji Pappan and his team of absolute misfits are back, and this time, they've traded their problematic goat Pinky for an even bigger headache: a massive golden trophy in a high-stakes tug-of-war competition. After the first movie ended, life didn't exactly get easier for Shaji Pappan (Jayasurya), who is still sporting his signature black shirt and Ray-Bans while battling a crippling backache. To keep their beloved sports club alive, the boys decide to compete in a tournament. Things go typically south when their won trophy is stolen by a rival team. Meanwhile, the "Dude" (Vinayakan), the dreaded villain from the first part, is having a terrible time working in a local restaurant, getting slapped by his employer just for fun. The real chaos begins with a massive misunderstanding—a staple of the franchise. Shaji Pappan orders medicine for his painful back, but through a chain of absolute stupidity, he ends up with counterfeit currency engraving plates meant for a dangerous criminal, Satan Xavier (Sunny Wayne). As demonetization hits, everyone—from Shaji's gang to the criminals—is scrambling for these plates. Pappan and his team, including the ever-loyal Arakkal Abu (Saiju Kurup) and the hilarious captain, try to navigate this dangerous mess without losing their sanity or their lives. They get pursued by S.I. Sarbath Shameer (Vijay Babu), who is desperately trying to prove himself. Despite all the odds, the gang defeats the real villains but not before causing a total disaster. The film ends with a classic Pappan move—chasing someone down, ensuring that the saga of their chaotic nonsensical life continues. In short, it's a non-stop, loud, and hilarious ride where logic goes to take a nap, and laughter wins at the tug-of-war.`;

// ── DATA BUILDERS (use MOVIE_NAME / MOVIE_NAME_2 at call-time) ────

function getScenesData() {
    const m1 = window.MOVIE_NAME || 'Film';
    const m2 = window.MOVIE_NAME_2 || m1 + ' 2';
    return [
        { scene_number: 1, film: 'film1', title: 'The Protagonist Introduced', description: `${m1}'s lead character is established — their world, their flaw, their misplaced confidence.`, characters: ['Protagonist'], tone: 'Narrative', importance_score: 8, anim: false, flash: false },
        { scene_number: 2, film: 'film1', title: 'The Inciting Incident', description: 'A competition, a confrontation, or a prize that sets everything into motion. Nobody was ready.', characters: ['Protagonist', 'Antagonist'], tone: 'Comedy', importance_score: 9, anim: true, flash: false },
        { scene_number: 3, film: 'film1', title: 'First Chaos Sequence', description: "The gang's first major failure. Every attempt backfires. Slapstick escalates rapidly.", characters: ['The Gang'], tone: 'Slapstick', importance_score: 7, anim: true, flash: false },
        { scene_number: 4, film: 'film1', title: 'The Unwanted Journey Begins', description: 'Events spiral beyond control. The group is dragged into an unplanned adventure against their will.', characters: ['The Gang'], tone: 'Chaos', importance_score: 8, anim: true, flash: false },
        { scene_number: 5, film: 'film1', title: 'The Villain Arrives', description: 'The antagonist is introduced — stylish, competent, carrying a very specific agenda.', characters: ['Antagonist'], tone: 'Narrative', importance_score: 9, anim: false, flash: false },
        { scene_number: 6, film: 'film1', title: 'The Great Mix-Up', description: 'All storylines collide in one spectacular convergence of incompetence.', characters: ['Everyone'], tone: 'Chaos', importance_score: 10, anim: true, flash: false },
        { scene_number: 7, film: 'film1', title: 'Comic Authority Figure', description: 'A law-enforcement character who prioritises personal comfort over actual law enforcement.', characters: ['Police Officer'], tone: 'Comedy', importance_score: 7, anim: true, flash: false },
        { scene_number: 8, film: 'film1', title: 'The Fight They Were Not Ready For', description: 'Confrontation using hopelessly inadequate resources. Defeat is rhythmic and thorough.', characters: ['The Gang', 'Thugs'], tone: 'Fight', importance_score: 8, anim: true, flash: false },
        { scene_number: 9, film: 'film1', title: `${m1} — Ironic Climax`, description: 'The MacGuffin ends up with the most unlikely character. The real winner was never the protagonist.', characters: ['Supporting Character'], tone: 'Climax', importance_score: 10, anim: true, flash: true },
        { scene_number: 10, film: 'film2', title: 'Flashback Bridge', description: `Transition from ${m1} to ${m2}. Time has passed. Fortunes have not improved.`, characters: ['Protagonist'], tone: 'Narrative', importance_score: 7, anim: false, flash: true },
        { scene_number: 11, film: 'film2', title: `${m2} — Hero Returns`, description: 'Same protagonist. New look. Zero lessons learned. Finances have deteriorated.', characters: ['Protagonist'], tone: 'Narrative', importance_score: 8, anim: false, flash: false },
        { scene_number: 12, film: 'film2', title: 'Villain Downfall Gag', description: `The fearsome antagonist from ${m1} is now in a humiliating daily situation. Running joke.`, characters: ['Old Antagonist'], tone: 'Slapstick', importance_score: 7, anim: true, flash: false },
        { scene_number: 13, film: 'film2', title: 'High-Stakes Competition', description: 'The gang enters a high-stakes event with everything on the line. Victory arrives against all probability.', characters: ['The Gang'], tone: 'Sports Comedy', importance_score: 9, anim: true, flash: false },
        { scene_number: 14, film: 'film2', title: 'Victory Immediately Reversed', description: 'The prize is lost within minutes. External chaos compounds the disaster.', characters: ['The Gang', 'Thieves'], tone: 'Chaos', importance_score: 9, anim: true, flash: false },
        { scene_number: 15, film: 'film2', title: 'Peak Absurdist Moment', description: 'The single most visually inexplicable scene of the saga. Costume. Authority. Bureaucracy.', characters: ['Protagonist', 'Boss'], tone: 'Absurdist', importance_score: 8, anim: true, flash: false },
        { scene_number: 16, film: 'film2', title: `${m2} — Accidental Hero Ending`, description: 'The gang dismantles a criminal network without understanding a single step. They win anyway.', characters: ['The Gang', 'Criminals'], tone: 'Action Climax', importance_score: 10, anim: true, flash: false },
    ];
}

function getScriptData() {
    const m1 = window.MOVIE_NAME || 'Film';
    return [
        { time: '0:00', narration: 'In the grand arena of Vadamvali, legends are forged and backs are broken. Enter Shaji Pappan.' },
        { time: '0:18', narration: 'But glory is fleeting. A sly trick, a rigged rope. The champion falls before the battle begins.' },
        { time: '0:30', narration: 'The whistle blows. Muscles strain. Dust rises. This isn\'t just a game; it\'s war on a dirt field.' },
        { time: '0:45', narration: 'Then, chaos. A goat. A very fast goat. Strategy goes out the window as the team chases dinner instead of victory.' },
        { time: '00:58', narration: 'Silence in the camp. The goat is gone. The trophy is gone. Only the stinging pain of defeat remains.' },
        { time: '1:18', narration: 'But Pappan doesn\'t stay down. A new scheme forms. It involves a lot of explaining and very little logic.' },
        { time: '1:30', narration: 'They train. They sweat. They pull tractors. Unfortunately, they pulled the wrong man\'s tractor.' },
        { time: '1:45', narration: 'The final pull. The rope is taut. Everything hinges on this single, agonizing moment.' },
        { time: '2:05', narration: 'Fast forward. The dust has settled for years. Pappan is now a man of peace, mostly.' },
        { time: '2:22', narration: 'Peace is boring. An old enemy knocks on the door, and the mustache twirls once again.' },
        { time: '2:38', narration: 'They hit the road. The destination is clear, but the navigation is being handled by an idiot.' },
        { time: '2:48', narration: 'One wrong turn. One angry mob. Suddenly, they are running from people they didn\'t even know they offended.' },
        { time: '3:00', narration: 'Cornered, Pappan unveils the \'Idi-minnal\' strategy. It makes absolutely no sense, which means it might just work.' },
        { time: '3:12', narration: 'Explosions. Flying kicks. The rope becomes a weapon. This is Vadamvali on a mythical scale.' },
        { time: '3:28', narration: 'And in the end... it was all about the goat. The goat had the trophy all along. Truly, an incredible tale.' }
    ];
}

function getPanelsData() {
    const m1 = window.MOVIE_NAME || 'Film';
    const m2 = window.MOVIE_NAME_2 || m1 + ' 2';
    return [
        { num: '01', title: 'Hero Entrance', desc: `${m1} protagonist arrives. Slow motion. Misplaced confidence.`, emoji: '🚶', style: 'cinematic', film: 'film1' },
        { num: '02', title: 'The Inciting Prize', desc: 'Competition won. Prize revealed. Regret incoming.', emoji: '🏆', style: 'comic', film: 'film1' },
        { num: '03', title: 'Chaos Sequence #1', desc: 'Rapid-fire fail montage. Attempt counters. Nothing works.', emoji: '💥', style: 'comic', film: 'film1' },
        { num: '04', title: 'The Unwanted Journey', desc: 'Wrong direction. Nobody consented to this trip.', emoji: '🚗', style: 'cinematic', film: 'film1' },
        { num: '05', title: 'Villain Reveal', desc: 'Low-angle reveal. Wind. Composure. The only plan in the room.', emoji: '😎', style: 'cinematic', film: 'film1' },
        { num: '06', title: 'The Collision', desc: 'Animated map: four storylines converging. Cartoon explosion.', emoji: '🗺', style: 'comic', film: 'film1' },
        { num: '07', title: 'The Brawl', desc: 'Side-scroll video-game fight. Health bars. Inadequate weapons.', emoji: '⚔️', style: 'comic', film: 'film1' },
        { num: '08', title: `${m1} — Climax`, desc: 'The MacGuffin meets its ironic fate. Everyone loses. One unlikely winner.', emoji: '✨', style: 'comic', film: 'film1' },
        { num: '09', title: '⚡ FILM BRIDGE', desc: `Static cut. ${m1} → ${m2}. New chapter.`, emoji: '📀', style: 'cinematic', film: 'bridge' },
        { num: '10', title: `${m2} — Return`, desc: 'Same protagonist. New outfit. Same trajectory.', emoji: '🖤', style: 'cinematic', film: 'film2' },
        { num: '11', title: 'Villain Humiliation', desc: 'The antagonist, diminished. Running gag activated.', emoji: '👋', style: 'comic', film: 'film2' },
        { num: '12', title: 'Tournament Victory', desc: 'High-stakes win. Brief, perfect moment of triumph.', emoji: '💪', style: 'comic', film: 'film2' },
        { num: '13', title: 'Double Disaster', desc: 'Split screen: prize stolen + world-collapse event.', emoji: '💸', style: 'comic', film: 'film2' },
        { num: '14', title: 'Peak Absurdist Scene', desc: 'Serious interrogation. Wrong costumes. Maximum contrast.', emoji: '👑', style: 'cinematic', film: 'film2' },
        { num: '15', title: 'Final Chase', desc: 'Infinite side-scroll. Everything in motion. Nobody knows the destination.', emoji: '🏃', style: 'comic', film: 'film2' },
    ];
}

function getShotsData() {
    return [
        { shot_number: '01', duration: '00:05–00:18', shot_type: 'Low angle wide', camera_movement: 'Slow tracking push-in', sound_effect: 'Engine revving', narration_text: '"Enter Shaji Pappan."', _internal_style: 'cinematic', _internal_title: 'Shot 1', _internal_music: 'Heroic march' },
        { shot_number: '02', duration: '00:18–00:30', shot_type: 'Extreme close up', camera_movement: 'Static', sound_effect: 'Rope snapping', narration_text: '"A sly trick..."', _internal_style: 'cinematic', _internal_title: 'Shot 2', _internal_music: 'Tension drone' },
        { shot_number: '03', duration: '00:30–00:45', shot_type: 'Wide shot', camera_movement: 'Fast pan side to side', sound_effect: 'Crowd cheering', narration_text: '"The whistle blows."', _internal_style: 'comic', _internal_title: 'Shot 3', _internal_music: 'Fast drum beat' },
        { shot_number: '04', duration: '00:45–00:58', shot_type: 'Tracking shot', camera_movement: 'Following the goat rapidly', sound_effect: 'Goat bleat, cartoon run', narration_text: '"Then, chaos. A goat."', _internal_style: 'comic', _internal_title: 'Shot 4', _internal_music: 'Comedic chase music' },
        { shot_number: '05', duration: '00:58–01:18', shot_type: 'Medium shot', camera_movement: 'Slow zoom out', sound_effect: 'Crickets', narration_text: '"Only the stinging pain..."', _internal_style: 'cinematic', _internal_title: 'Shot 5', _internal_music: 'Sad trombone' },
        { shot_number: '06', duration: '01:18–01:30', shot_type: 'Over the shoulder', camera_movement: 'Static', sound_effect: 'Chalk on board', narration_text: '"A new scheme forms."', _internal_style: 'cinematic', _internal_title: 'Shot 6', _internal_music: 'Mischievous pizzicato' },
        { shot_number: '07', duration: '01:30–01:45', shot_type: 'Low angle wide', camera_movement: 'Tilt up', sound_effect: 'Tractor engine straining', narration_text: '"They train. They sweat."', _internal_style: 'comic', _internal_title: 'Shot 7', _internal_music: 'Training montage rock' },
        { shot_number: '08', duration: '01:45–02:05', shot_type: 'Hero shot', camera_movement: 'Circular tracking', sound_effect: 'Camera clicks', narration_text: '"The final pull."', _internal_style: 'comic', _internal_title: 'Shot 8', _internal_music: 'Triumphant fanfare' },
        { shot_number: '09', duration: '02:05–02:22', shot_type: 'Close up', camera_movement: 'Fast cuts', sound_effect: 'Paper flipping rapidly', narration_text: '"Fast forward."', _internal_style: 'cinematic', _internal_title: 'Shot 9', _internal_music: 'Clock ticking' },
        { shot_number: '10', duration: '02:22–02:38', shot_type: 'High angle', camera_movement: 'Slow push in', sound_effect: 'Heavy knock on door', narration_text: '"An old enemy knocks..."', _internal_style: 'cinematic', _internal_title: 'Shot 10', _internal_music: 'Ominous brass chord' },
        { shot_number: '11', duration: '02:38–02:48', shot_type: 'Wide shot', camera_movement: 'Static', sound_effect: 'Van backfiring', narration_text: '"They hit the road."', _internal_style: 'comic', _internal_title: 'Shot 11', _internal_music: 'Quirky travel tune' },
        { shot_number: '12', duration: '02:48–03:00', shot_type: 'Tracking backwards', camera_movement: 'Handheld shake', sound_effect: 'Angry mob yelling', narration_text: '"One angry mob."', _internal_style: 'comic', _internal_title: 'Shot 12', _internal_music: 'High tempo chase string' },
        { shot_number: '13', duration: '03:00–03:12', shot_type: 'Close up', camera_movement: 'Dynamic push in', sound_effect: 'Thunderclap', narration_text: '"Idi-minnal strategy."', _internal_style: 'cinematic', _internal_title: 'Shot 13', _internal_music: 'Epic choir hit' },
        { shot_number: '14', duration: '03:12–03:28', shot_type: 'Extreme wide', camera_movement: 'Slow motion pull back', sound_effect: 'Boom, powder sizzle', narration_text: '"Explosions. Flying kicks."', _internal_style: 'comic', _internal_title: 'Shot 14', _internal_music: 'Climactic orchestral swell' },
        { shot_number: '15', duration: '03:28–04:50', shot_type: 'Close up', camera_movement: 'Static', sound_effect: 'Goat chewing', narration_text: '"And in the end..."', _internal_style: 'comic', _internal_title: 'Shot 15', _internal_music: 'Irony oboe melody' }
    ];
}
