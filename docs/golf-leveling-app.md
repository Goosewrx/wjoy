# Golf Leveling App Concept

## Vision

Build a golf training app that makes practice feel like an RPG progression system. The player receives "system" prompts, completes daily quests, clears course challenges, earns XP, ranks up, and unlocks new skill focuses tied to real golf improvement.

The tone can be inspired by dramatic leveling anime, but the product should use original names, visuals, story, and audio rather than copying protected show assets.

## 30-second pitch

**Working title:** System Caddie

System Caddie turns every range session or round into a quest log:

- Hit practice goals to gain XP.
- Improve driving, approach, short game, putting, consistency, and course management stats.
- Clear "gates" that are actually focused golf challenges.
- Unlock higher ranks by proving skill across multiple categories.
- Get dramatic feedback when the app detects a great swing, personal best, streak, or rank-up.

## Core loop

1. **Choose a quest**
   - Daily: "Land 10 approach shots inside 30 feet."
   - Training: "Record 20 smooth tempo swings."
   - Course gate: "Play 3 holes at bogey-or-better with no penalty shots."
2. **Track real activity**
   - Manual entry for the first MVP.
   - Wiimote swing sensing for an on-macOS prototype in this repository.
   - Future mobile/watch integrations for production.
3. **Score the attempt**
   - Award XP for completion, streaks, consistency, and personal-best deltas.
   - Award stat XP to the skill category that was practiced.
4. **Show system feedback**
   - Quest complete.
   - Stat increased.
   - Rank promotion trial unlocked.
   - New challenge tier available.
5. **Progress to harder gates**
   - Beginner challenges emphasize contact and direction.
   - Intermediate challenges emphasize dispersion and recovery.
   - Advanced challenges emphasize scoring under pressure.

## Player stats

| Stat | Golf meaning | Example growth signal |
| --- | --- | --- |
| Power | Driving distance and ball speed | Longer average carry, faster swing reading |
| Precision | Start line and approach accuracy | Smaller shot dispersion |
| Touch | Short game and putting feel | Better proximity from short distances |
| Focus | Consistency under pressure | Fewer blow-up holes, better streaks |
| Strategy | Course management | Smarter club choice, fewer penalties |
| Tempo | Repeatable swing rhythm | Stable backswing/downswing timing |

## Rank system

Ranks should represent demonstrated golf capability rather than only total XP.

| Rank | Theme | Promotion requirement examples |
| --- | --- | --- |
| E | New player | Complete onboarding quests |
| D | Range regular | Finish 5 practice sessions and log first 9-hole score |
| C | Course challenger | Complete one gate in driving, approach, short game, and putting |
| B | Shot maker | Maintain consistency streaks and reduce penalties |
| A | Tournament ready | Clear pressure challenges with scoring targets |
| S | Elite | Complete multi-round boss gates and maintain advanced stat thresholds |

## MVP feature set

Start with a small app that proves the fantasy and the practice loop before adding complex sensors.

### MVP 1: Quest log and progression

- Player profile with level, rank, XP, and six golf stats.
- Daily quest list with clear completion criteria.
- Manual result entry.
- XP calculation and rank-up checks.
- Activity history.
- Dramatic "system message" UI copy.

### MVP 2: Wiimote swing prototype in this repo

This repository already contains a macOS Wiimote stack. A prototype can use the Wiimote as a practice-club sensor:

- Connect to a Wiimote.
- Enable accelerometer readings.
- Detect swing attempts from acceleration peaks.
- Estimate tempo and repeatability.
- Feed swing events into the progression engine.

Relevant existing entry points:

- `examples/WATest/MainController.m` shows connection and accelerometer callbacks.
- `Wiimote/WiimoteDelegate.h` exposes accelerometer gravity and pitch/roll delegate methods.
- `Wiimote/WiimoteMotionPlusDelegate.h` exposes yaw, roll, and pitch speed reports when MotionPlus is available.
- `WJoy/MainController.m` shows the current app bootstrap pattern.

### MVP 3: Practice session mode

- Start a timed range session.
- Pick one skill focus.
- Track reps, consistency, and completion.
- Award XP at the end of the session.
- Use notifications, LEDs, or vibration for rank-up and quest-complete feedback.

## Suggested architecture for this codebase

The existing project is a legacy Objective-C macOS app. Keep the first prototype small and separate from the joystick-emulation behavior.

```
GolfLeveling/
  GolfPlayerProfile
  GolfQuest
  GolfProgressionEngine
  GolfSwingEvent
  GolfSessionStore
  GolfSystemMessagePresenter

Wiimote swing prototype
  Wiimote delegate callbacks
    -> GolfSwingDetector
    -> GolfProgressionEngine
    -> notifications / LEDs / session log
```

### Component responsibilities

- **GolfSwingDetector**
  - Converts accelerometer and MotionPlus updates into swing events.
  - Emits speed, tempo, repeatability, and confidence values.
- **GolfProgressionEngine**
  - Owns XP, stat growth, quest completion, level thresholds, and rank checks.
  - Has no UI or Wiimote dependency.
- **GolfSessionStore**
  - Persists profiles, quests, and session summaries.
  - Use plist or JSON first; move to Core Data only when the model becomes richer.
- **GolfSystemMessagePresenter**
  - Shows quest-complete, level-up, and promotion messages.
  - Can initially use `UserNotification`.

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

GolfSwingEvent
  NSDate *timestamp;
  CGFloat peakAcceleration;
  CGFloat tempoScore;
  CGFloat repeatabilityScore;
  CGFloat confidence;
```

## Swing scoring prototype

For a Wiimote proof of concept, keep the first swing detector simple:

1. Maintain a rolling window of accelerometer magnitudes.
2. Treat a swing candidate as a peak above a calibrated threshold.
3. Require a cooldown window so one swing is not counted multiple times.
4. Estimate tempo from time between backswing and downswing peaks.
5. Score repeatability by comparing recent swing peak and tempo variance.

This will not measure ball flight, but it can make practice reps and tempo quests feel responsive.

## Example quests

- **Daily warm-up:** Record 20 smooth swings.
- **Tempo trial:** Keep 10 swings within a target tempo band.
- **Precision gate:** Log 15 shots with intended target and result.
- **Short-game dungeon:** Complete 9 up-and-down attempts.
- **Boss gate:** Play 3 holes with no double bogeys.
- **Promotion trial:** Clear one quest from every stat category in the same week.

## Product risks

- Real shot quality is difficult to infer from a Wiimote alone.
- A desktop Wiimote prototype is useful for experimentation, but a production golf app likely belongs on mobile and watch devices.
- The fantasy layer should motivate practice without hiding the real training metrics.
- Progression must reward improvement, not only raw skill, so newer golfers do not feel stuck.

## Best next implementation step

Create the model-only progression engine first. It can be tested without hardware, then connected to manual entry, then connected to Wiimote swing events.
