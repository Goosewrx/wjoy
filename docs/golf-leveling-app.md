# Golf Leveling App Concept

## Vision

Build a golf training app that makes practice feel like an RPG progression system. The golfer receives "system" prompts, completes daily quests, logs practice and round results, earns XP, ranks up, and unlocks new skill focuses tied to real golf improvement.

The tone can be inspired by dramatic leveling anime, but the product should use original names, visuals, story, and audio rather than copying protected show assets.

## 30-second pitch

**Working title:** System Caddie

System Caddie turns every range session or round into a quest log:

- Enter practice results and scorecard outcomes to gain XP.
- Improve driving, approach, short game, putting, consistency, and course management stats.
- Clear "gates" that are focused golf challenges.
- Unlock higher ranks by proving skill across multiple categories.
- Get dramatic feedback when the golfer logs a personal best, finishes a quest, keeps a streak, or earns a rank-up.

## Core loop

1. **Choose a quest**
   - Daily: "Log 30 putts from 6 feet."
   - Training: "Complete 20 range balls with a fairway target selected."
   - Course gate: "Play 3 holes at bogey-or-better with no penalty shots."
2. **Enter real golf activity**
   - Practice session form for reps, targets, makes, misses, distance bands, and notes.
   - Round form for hole scores, fairways, greens in regulation, putts, penalties, and recovery shots.
   - Quick-add buttons for common practice drills.
3. **Score the attempt**
   - Award XP for completion, streaks, consistency, and personal-best improvements.
   - Award stat XP to the skill category that was practiced.
4. **Show system feedback**
   - Quest complete.
   - Stat increased.
   - Rank promotion trial unlocked.
   - New challenge tier available.
5. **Progress to harder gates**
   - Beginner challenges emphasize contact, basic scoring, and repeatable practice habits.
   - Intermediate challenges emphasize dispersion, up-and-downs, and fewer penalties.
   - Advanced challenges emphasize scoring under pressure and multi-round consistency.

## Player stats

| Stat | Golf meaning | Manual growth signal |
| --- | --- | --- |
| Power | Useful distance off the tee | Logged driving distance bands and playable tee shots |
| Precision | Start line, fairways, and approach accuracy | Fairways hit, greens in regulation, target drill success |
| Touch | Short game and putting feel | Up-and-down rate, putts made by distance, three-putt avoidance |
| Focus | Consistency under pressure | Streaks, blow-up-hole avoidance, completed pressure drills |
| Strategy | Course management | Penalty avoidance, smart layups, conservative target choices |
| Tempo | Repeatable practice routine | Completed warm-ups, pre-shot routine tracking, consistent drill notes |

## Rank system

Ranks should represent demonstrated golf capability rather than only total XP. Rank checks should use logged evidence from rounds and practice sessions.

| Rank | Theme | Promotion requirement examples |
| --- | --- | --- |
| E | New player | Complete onboarding quests and log baseline scores |
| D | Range regular | Finish 5 practice sessions and log first 9-hole score |
| C | Course challenger | Complete one gate in driving, approach, short game, and putting |
| B | Shot maker | Maintain consistency streaks and reduce penalties over multiple rounds |
| A | Tournament ready | Clear pressure challenges with scoring targets |
| S | Elite | Complete multi-round boss gates and maintain advanced stat thresholds |

## MVP feature set

Start with a small manual-entry app that proves the fantasy and the practice loop before considering any sensors or integrations.

### MVP 1: Quest log and progression

- Player profile with level, rank, XP, and six golf stats.
- Daily quest list with clear completion criteria.
- Manual result entry for practice and rounds.
- XP calculation and rank-up checks.
- Activity history.
- Dramatic "system message" UI copy.

### MVP 2: Manual practice session mode

- Start a range, putting, short-game, or course-management session.
- Pick one skill focus.
- Enter reps, successes, misses, target distance, club, and notes.
- Track completion percentage and quality score.
- Award XP at the end of the session.

### MVP 3: Scorecard and round logging

- Log 9-hole or 18-hole rounds.
- Track score, fairways, greens in regulation, putts, penalties, sand saves, and up-and-downs.
- Convert round stats into stat XP.
- Unlock course gates and boss gates based on logged performance.

## Suggested app architecture

This should be designed as a manual-entry product first. The progression engine should not depend on sensors, hardware, or a specific UI framework.

```
GolfLeveling/
  GolfPlayerProfile
  GolfQuest
  GolfProgressionEngine
  GolfPracticeSession
  GolfRound
  GolfScorecardHole
  GolfSessionStore
  GolfSystemMessagePresenter
```

### Component responsibilities

- **GolfProgressionEngine**
  - Owns XP, stat growth, quest completion, level thresholds, and rank checks.
  - Accepts logged practice sessions and rounds as input.
  - Has no UI dependency.
- **GolfPracticeSession**
  - Stores session type, skill focus, reps, successes, misses, clubs, distances, and notes.
  - Calculates completion and quality values for quests.
- **GolfRound**
  - Stores course, tee, date, total score, and per-hole stats.
  - Feeds fairways, greens, putts, penalties, and scoring milestones into progression.
- **GolfSessionStore**
  - Persists profiles, quests, practice sessions, and round summaries.
  - Use JSON or a local database depending on the target platform.
- **GolfSystemMessagePresenter**
  - Shows quest-complete, level-up, personal-best, and promotion messages.

## Initial data model

```objc
GolfPlayerProfile
  NSString *playerName;
  NSUInteger level;
  NSString *rank;
  NSUInteger totalXP;
  NSDictionary *stats; // power, precision, touch, focus, strategy, tempo

GolfQuest
  NSString *identifier;
  NSString *title;
  NSString *category;
  NSUInteger targetCount;
  NSUInteger progressCount;
  NSUInteger rewardXP;
  NSDictionary *statRewards;

GolfPracticeSession
  NSDate *date;
  NSString *sessionType; // range, putting, shortGame, strategy
  NSString *skillFocus;
  NSUInteger reps;
  NSUInteger successes;
  NSString *club;
  NSString *distanceBand;
  NSString *notes;

GolfRound
  NSDate *date;
  NSString *courseName;
  NSUInteger holesPlayed;
  NSUInteger totalScore;
  NSUInteger fairwaysHit;
  NSUInteger greensInRegulation;
  NSUInteger putts;
  NSUInteger penalties;
```

## Manual-entry scoring prototype

Keep the first scoring model understandable to golfers:

1. Award base XP for logging a valid practice session or round.
2. Award quest XP when a logged result satisfies a quest condition.
3. Award stat XP based on the session focus or scorecard category.
4. Award bonus XP for personal bests, streaks, and no-penalty rounds.
5. Require specific evidence for rank promotions, not just total XP.

Example formulas:

- Putting drill XP = base session XP + made-putt bonus + streak bonus.
- Round XP = holes played XP + scoring milestone XP + penalty-avoidance bonus.
- Precision XP = fairways hit + greens in regulation + target drill successes.
- Touch XP = up-and-downs + putting makes + three-putt avoidance.

## Example quests

- **Daily warm-up:** Log 20 putting reps before a round.
- **Tempo ritual:** Complete 3 practice sessions with a pre-shot routine note.
- **Precision gate:** Log 15 target-shot attempts and hit at least 8.
- **Short-game dungeon:** Complete 9 up-and-down attempts.
- **Boss gate:** Play 3 holes with no double bogeys.
- **Promotion trial:** Clear one quest from every stat category in the same week.

## Product risks

- Manual entry must be very fast or golfers will stop using it.
- XP should reward honest improvement without encouraging fake or inflated entries.
- The fantasy layer should motivate practice without hiding the real training metrics.
- Progression must reward improvement, not only raw skill, so newer golfers do not feel stuck.

## Best next implementation step

Create the model-only progression engine and manual-entry flows first. A golfer should be able to create a profile, choose a quest, enter a practice session or scorecard, and see XP/stat/rank changes immediately.
