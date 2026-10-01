import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '01_splash_intro.dart';
import '02_onboarding_welcome.dart';
import '03_onboarding_gamification.dart';
import '04_language_selection.dart';
import '05_goal_motivation.dart';
import '06_daily_pace_target.dart';
import '07_proficiency_placement.dart';
import '08_auth_signup_prompt.dart';
import '09_home_learning_path.dart';
import '10_lesson_word_match.dart';
import '11_lesson_listening_karaoke.dart';
import '12_lesson_sprechen_speech.dart';
import '13_lesson_sentence_builder.dart';
import '14_lesson_complete_celebration.dart';
import '15_streak_flame_milestone.dart';
import '16_leaderboard_leagues.dart';
import '17_quests_achievements.dart';
import '18_shop_inventory.dart';
import '19_user_profile_stats.dart';

/// Screen Navigator Hub
/// An interactive showcase viewer allowing developers and stakeholders to jump
/// to any of the 19 numbered screens or step through them sequentially.
class ScreenNavigatorHub extends StatefulWidget {
  final int initialScreenIndex;

  const ScreenNavigatorHub({super.key, this.initialScreenIndex = 0});

  @override
  State<ScreenNavigatorHub> createState() => _ScreenNavigatorHubState();
}

class _ScreenNavigatorHubState extends State<ScreenNavigatorHub> {
  late int _currentIndex;

  final List<String> _screenTitles = [
    '01. Splash Screen — Brand Intro',
    '02. Onboarding — Mascot Welcome',
    '03. Onboarding — Gamification & Streaks',
    '04. Language Selection — Grid',
    '05. Motivation & Purpose — Why Learn',
    '06. Daily Pace Target — 5m to 20m',
    '07. Proficiency Placement — Choice',
    '08. Account Sign Up — Profile / Guest',
    '09. Home — Archipelago Learning Path',
    '10. Lesson — Match Word Pairs',
    '11. Lesson — Listening & Karaoke',
    '12. Lesson — Sprechen Speech & Lip-Sync',
    '13. Lesson — Sentence Builder Tiles',
    '14. Celebration — Lesson Complete XP',
    '15. Retention — Streak Flame Milestone',
    '16. Social — Oceanic Leagues Leaderboard',
    '17. Gamification — Quests & Achievements',
    '18. Shop — Oxygen, Freezes & Outfits',
    '19. Profile — Learning Stats & Badges',
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialScreenIndex.clamp(0, _screenTitles.length - 1);
  }

  void _nextScreen() {
    if (_currentIndex < _screenTitles.length - 1) {
      setState(() => _currentIndex++);
    }
  }

  void _prevScreen() {
    if (_currentIndex > 0) {
      setState(() => _currentIndex--);
    }
  }

  Widget _buildCurrentScreen() {
    switch (_currentIndex) {
      case 0:
        return Screen01SplashIntro(onNext: _nextScreen);
      case 1:
        return Screen02OnboardingWelcome(onNext: _nextScreen);
      case 2:
        return Screen03OnboardingGamification(onNext: _nextScreen);
      case 3:
        return Screen04LanguageSelection(onNext: _nextScreen);
      case 4:
        return Screen05GoalMotivation(onNext: _nextScreen);
      case 5:
        return Screen06DailyPaceTarget(onNext: _nextScreen);
      case 6:
        return Screen07ProficiencyPlacement(onNext: _nextScreen);
      case 7:
        return Screen08AuthSignupPrompt(
          onSignUp: _nextScreen,
          onContinueGuest: _nextScreen,
        );
      case 8:
        return Screen09HomeLearningPath(
          onNodeTap: _nextScreen,
          onNavTap: (navIdx) {
            // Jump to respective feature screens from bottom nav
            if (navIdx == 1) setState(() => _currentIndex = 15); // Leagues
            if (navIdx == 2) setState(() => _currentIndex = 16); // Quests
            if (navIdx == 3) setState(() => _currentIndex = 17); // Shop
            if (navIdx == 4) setState(() => _currentIndex = 18); // Profile
          },
        );
      case 9:
        return Screen10LessonWordMatch(onComplete: _nextScreen);
      case 10:
        return Screen11LessonListeningKaraoke(onComplete: _nextScreen);
      case 11:
        return Screen12LessonSprechenSpeech(onComplete: _nextScreen);
      case 12:
        return Screen13LessonSentenceBuilder(onComplete: _nextScreen);
      case 13:
        return Screen14LessonCompleteCelebration(onContinue: _nextScreen);
      case 14:
        return Screen15StreakFlameMilestone(onContinue: _nextScreen);
      case 15:
        return Screen16LeaderboardLeagues(onBack: () => setState(() => _currentIndex = 8));
      case 16:
        return Screen17QuestsAchievements(onBack: () => setState(() => _currentIndex = 8));
      case 17:
        return Screen18ShopInventory(onBack: () => setState(() => _currentIndex = 8));
      case 18:
        return Screen19UserProfileStats(onBack: () => setState(() => _currentIndex = 8));
      default:
        return Screen01SplashIntro(onNext: _nextScreen);
    }
  }

  void _showScreenPickerModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Jump to Any Screen (01 - 19)',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF1E293B),
                ),
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.separated(
                itemCount: _screenTitles.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (ctx, idx) {
                  final isCurrent = idx == _currentIndex;
                  return ListTile(
                    dense: true,
                    selected: isCurrent,
                    selectedTileColor: const Color(0xFFE0F2FE),
                    title: Text(
                      _screenTitles[idx],
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: isCurrent ? FontWeight.w900 : FontWeight.w600,
                        color: isCurrent ? const Color(0xFF0284C7) : const Color(0xFF334155),
                      ),
                    ),
                    trailing: isCurrent ? const Icon(Icons.check_circle, color: Color(0xFF0284C7), size: 18) : null,
                    onTap: () {
                      Navigator.pop(ctx);
                      setState(() => _currentIndex = idx);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Active Screen
          Positioned.fill(
            child: _buildCurrentScreen(),
          ),

          // Floating Navigation Bar (Bottom Overlay for easy switching)
          Positioned(
            left: 16,
            right: 16,
            bottom: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withOpacity(0.92),
                borderRadius: BorderRadius.circular(9999),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded, color: Colors.white, size: 28),
                    onPressed: _currentIndex > 0 ? _prevScreen : null,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: _showScreenPickerModal,
                      child: Text(
                        'Screen ${_currentIndex + 1} of ${_screenTitles.length}\n${_screenTitles[_currentIndex].split(' — ').first}',
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 28),
                    onPressed: _currentIndex < _screenTitles.length - 1 ? _nextScreen : null,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
