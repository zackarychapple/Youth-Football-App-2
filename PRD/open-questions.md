# Open Questions Document
## Youth Football Game Management System

### Version 1.0
### Date: August 2025

---

## Overview

This document catalogs critical questions that need stakeholder input before finalizing implementation decisions. Questions are organized by category and prioritized by their impact on the MVP launch.

---

## Business & League Rules

### High Priority Questions

1. **League Variability**
   - Which youth football leagues are we targeting initially? Cobb Football League (CFL)
   - How much do MPR rules vary between leagues? Doesn't matter, we only care about one league, but our league is 8 plays
   - Should we build a configurable rules engine from the start, or hard-code for one league? hardcode for now
   - Are there penalties for MPR violations we need to track/report? We're not worried about this

2. **Minimum Play Requirements Details**
   - Is the 8-play minimum universal or does it vary by age group? universal
   - Do playoffs have different MPR requirements? no
   - How are special teams plays counted toward MPR? yes, but mark the play as special teams and make it so a team can disable it counting
   - Do injured plays count toward the minimum before injury? yes
   - What constitutes a "play" - must the ball be snapped? snapped or penalty (but we should track if it was a penalty play in case parents complain)

3. **Game Structure Variations**
   - Do all leagues use 4 quarters or do some use halves? 4 quarters
   - Are there different timing rules we need to support (running clock, stop clock)? doesn't matter
   - How do overtime rules affect MPR calculations? don't count towards MPR, but we should count the plays still. 
   - Do we need to support different field sizes (80-yard vs 100-yard)? 40, 80, 100 yard, this should be configured at the game level

4. **Compliance & Reporting**
   - What documentation is required for MPR compliance? A summary report at the end of the game that is always available would be helpful
   - Who needs access to compliance reports (league officials, opposing coaches)? it should be open access with an uuid link / passcode
   - Are there audit requirements we need to support? no
   - How long must game data be retained for league purposes? forever

### Medium Priority Questions

5. **Season Structure**
   - How many games in a typical season? 13
   - Do we need to support tournament/playoff brackets? no
   - Should we track practice attendance/participation? yes
   - Are there pre-season/scrimmage games with different rules? yes, scrimmage we track stats (as a special game that can be excluded overall stats), and MPR doesn't count

6. **Team Composition**
   - What's the typical roster size range? (Assumed 15-25, but need confirmation) this is fine
   - Are there rules about roster changes mid-season? no
   - Do we need to track player eligibility (age, weight, grade)? yes, some kids may be "striped" meaning they can't run the ball
   - How are "call-ups" from younger teams handled? doesn't happen

---

## User Experience

### High Priority Questions

7. **Coach Technical Proficiency**
   - What percentage of coaches are comfortable with smartphones? 100%
   - Should we provide a simplified "basic mode" for less technical users? yes, this should be default
   - Do coaches typically have assistants who could handle the technology? yes
   - Is there a need for a non-digital backup system? no

8. **Game Day Workflow**
   - What's the typical pre-game routine? When would coaches set up the app? 5 - 10 minutes before the game they will select who's there
   - Do coaches need to track pre-game warmup participation? no
   - How do weather delays affect the tracking workflow? no
   - Should the app support "scout team" or practice squad tracking? no

9. **Critical Features vs Nice-to-Have**
   - Is tracking defensive plays as important as offensive plays for MPR? yes, we need to know how many kids make tackles, we also should allow random notes on every play (just text based)
   - Do coaches need real-time stats during the game or just MPR tracking? yes, make it a tab they can switch to
   - How important are position assignments vs just tracking who's on the field? they may want to add who's in which position during a play or after
   - Is play outcome (yards, touchdown) critical for MVP or can it wait? yes, its critical, and to make things easier, if the ball is on the opponents 40 and they click touchdown as the outcome, it should automatically do a 40 yard touchdown

10. **Multi-User Scenarios**
    - How many coaches typically need access per team? 3-5
    - Should offensive and defensive coordinators have different views? no
    - Do team parents/administrators need read-only access? yes
    - How do we handle coach changes mid-season? doesn't matter

### Medium Priority Questions

11. **Parent Engagement**
    - Do parents expect real-time game updates? yes
    - Should parents see their child's stats only or team-wide stats? both
    - How do we handle divorced/separated parent access? doesn't matter
    - Is there appetite for a parent mobile app? yes, but not in scope now. 

12. **Post-Game Workflow**
    - How soon after games do coaches typically review/correct data? that night
    - Who needs game reports and in what format? nobody
    - Should we support video review integration? no
    - Do coaches share stats with players/parents immediately? yes

---

## Technical & Integration

### High Priority Questions

13. **Offline Requirements**
    - What percentage of fields have reliable cellular/WiFi coverage? Most, but only one person will track stats so no need to have conflict resolution, but should function offline and upload as soon as connection restored
    - How long should the app function completely offline? a whole game
    - Is peer-to-peer sync between coaches' devices needed? no
    - Should we support downloading roster data for entire season? no

14. **Integration Needs**
    - Are there existing league management systems we need to integrate with? none
    - Should we support roster import from spreadsheets/CSV? no
    - Do we need to export to specific formats for league reporting? no
    - Is there a need for scoreboard system integration? no

15. **Data Privacy & Security**
    - What parental consent is required for player data collection? none
    - Can we store player photos or is that a privacy concern? not needed
    - How do we handle data requests from divorced parents? not needed
    - What data can be shared publicly (team stats) vs private (individual stats)? everything is public

### Medium Priority Questions

16. **Platform Decisions**
    - Should we prioritize iOS or Android for initial release? iOS
    - Is a web-only (PWA) solution acceptable or do coaches expect native apps? Web only
    - Do we need tablet support for coaches who prefer larger screens? No
    - Should we support Apple Watch for quick play counting? No

17. **Performance Targets**
    - What's acceptable latency for play entry? (Assumed < 2 seconds) Yes
    - How many concurrent games do we expect during peak Saturday mornings? 1
    - What's the expected data retention period? indefinite
    - Should we support video uploads for play review? not needed

---

## Data & Analytics

### High Priority Questions

18. **Statistical Accuracy**
    - What level of statistical detail is required for league reporting? none
    - How do we handle disputed statistics between teams? not needed
    - Should statistics be "official" or just for team use? just for team use
    - Do we need to track referee penalties and their impact? yes, and ideally optionally which player caused it

19. **Historical Data**
    - How many seasons of historical data should be readily accessible? not needed
    - Should player stats follow them if they change teams? not needed
    - Do we track player development metrics across seasons? not needed
    - Is there value in league-wide aggregated analytics? not needed

### Medium Priority Questions

20. **Advanced Analytics**
    - Should we calculate efficiency metrics (yards per play, completion percentage)? yes, and third down conversions
    - Is there interest in play calling tendencies analysis? Not now
    - Do coaches want player performance trends? not now
    - Should we provide opponent scouting reports based on historical data? not now

21. **Export & Sharing**
    - What formats do coaches need for data export? not needed
    - Should we support social media integration for game summaries? not needed
    - Do local newspapers need access to game stats? not needed
    - Is there a need for printable reports for team meetings? not needed

---

## Edge Cases & Error Handling

### High Priority Questions

22. **Game Irregularities**
    - How do we handle forfeits in terms of MPR tracking? not needed
    - What if a game is called early due to weather/mercy rule? not needed
    - How do we track players who arrive late to games? Mark them as late allow coaches to deduct MPR
    - What happens if a player is ejected? Mark when they were ejected and what MPR was at that point

23. **Substitution Complexities**
    - Can players switch jersey numbers mid-game? not needed
    - How do we handle two-way players (offense and defense)? They should be allowed to play both sides easily
    - What if there are less than 11 players available? won't happen
    - How do we track special teams-only players? won't happen

24. **Data Conflicts**
    - What if two coaches enter conflicting information? wont happen, only one will be entering data at once, if two happens they can manually delete after
    - How do we handle sync conflicts when returning online? coaches can manually reconcile, just highlight that seems like two coaches had conflicting data but most likely won't hapen
    - What's the source of truth for disputed plays? not needed
    - Can coaches "lock" a game to prevent further edits? not needed

### Medium Priority Questions

25. **Injury Scenarios**
    - Do we need to track injury severity/type? not needed
    - How do we handle players who return mid-game from injury? track when they come back and percentage of game missed 
    - Should we prevent injured players from being added to plays? if they get added to a play ask if they are done being injured
    - Do we need injury reports for league/insurance purposes? not needed

26. **Rule Violations**
    - Should the app prevent/warn about illegal formations? warn if > 11 people on field
    - How do we handle plays nullified by penalties? mark it as nullified but still track against MPC
    - Do we track ineligible player infractions? not needed
    - Should we alert when approaching MPR violations? only in 4th quarter

---

## Business Model & Pricing

### Questions for Future Consideration

27. **Monetization Strategy**
    - Is this a free tool for youth sports or subscription-based? Free
    - Would leagues pay for official integration? not needed
    - Should we offer premium features (video, advanced stats)? not needed
    - Is there opportunity for sponsorship/advertising? Sponsored by Zephyr Cloud

28. **Support Model**
    - What level of customer support is expected? not needed
    - Should we provide coach training/certification? not needed
    - Do we need 24/7 support during game days? not needed
    - Should we have league-specific support representatives? not needed

29. **Growth Strategy**
    - Should we expand to other youth sports? not needed
    - Is there international market opportunity? not needed
    - Should we build a marketplace for plays/strategies? not needed
    - Could this become a recruiting platform? not needed

---

## Implementation Priority Matrix

### Must Answer Before MVP
- Questions 1, 2, 7, 8, 9, 13, 14, 15, 18, 22, 23

### Should Answer Before MVP
- Questions 3, 4, 10, 16, 19, 24

### Can Defer Until Post-MVP
- Questions 5, 6, 11, 12, 17, 20, 21, 25, 26

### Future Consideration
- Questions 27, 28, 29

---

## Recommended Next Steps

1. **Immediate Actions**
   - Schedule stakeholder interviews with 5-10 active youth coaches
   - Review rule books from top 3 youth football leagues
   - Conduct field observations at 3-5 youth games
   - Survey parents about their expectations

2. **Pre-Development Validation**
   - Create paper prototype for coach testing
   - Run simulated game scenarios
   - Test in various weather/lighting conditions
   - Validate MPR calculation logic with league officials

3. **Ongoing Research**
   - Join youth football coach forums/groups
   - Attend league meetings
   - Monitor competitor products
   - Track regulation changes

---

## Contact for Clarification

For questions requiring immediate answers, prioritize reaching out to:

1. **League Officials** - For rules and compliance requirements
2. **Active Coaches** - For workflow and feature priorities  
3. **Team Parents** - For communication and access needs
4. **Technology Coordinators** - For integration requirements
5. **Legal Counsel** - For privacy and liability concerns

---

## Document Maintenance

This document should be updated as questions are answered and new questions arise. Each answer should include:
- Date answered
- Source of answer
- Impact on implementation
- Any follow-up questions generated
