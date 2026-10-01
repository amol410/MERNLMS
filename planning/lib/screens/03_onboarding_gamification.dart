import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/animated_dolphin_mascot.dart';
import '../widgets/tactile_game_button.dart';

/// Screen 03: Onboarding Gamification & Habit Value Proposition
/// Showcases bite-sized lessons, streaks, and speech recognition.
class Screen03OnboardingGamification extends StatelessWidget {
  final VoidCallback? onNext;

  const Screen03OnboardingGamification({super.key, this.onNext});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Dots Progress
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildDot(isActive: false),
                    const SizedBox(width: 8),
                    _buildDot(isActive: true),
                    const SizedBox(width: 8),
                    _buildDot(isActive: false),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Mascot Header Row
              Row(
                children: [
                  const AnimatedDolphinMascot(
                    size: 90,
                    accessory: MascotAccessory.trophy,
                    isCelebrating: true,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'Why learners love LingoDolphin',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF1E293B),
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // 3 Value Proposition Cards
              _buildPerkCard(
                icon: Icons.bolt_rounded,
                iconColor: const Color(0xFFF59E0B),
                title: 'Bite-Sized Lessons',
                desc: 'Fun, gamified 3-minute lessons designed for quick daily progress on the go.',
              ),
              const SizedBox(height: 14),
              _buildPerkCard(
                icon: Icons.local_fire_department_rounded,
                iconColor: const Color(0xFFEF4444),
                title: 'Streaks & Ocean Leagues',
                desc: 'Compete in weekly leagues, earn pearls, and build an unbreakable daily streak.',
              ),
              const SizedBox(height: 14),
              _buildPerkCard(
                icon: Icons.mic_rounded,
                iconColor: const Color(0xFF06B6D4),
                title: 'Real Pronunciation Practice',
                desc: 'Practice speaking with our interactive character and get instant feedback.',
              ),

              const Spacer(),

              // Action Button
              TactileGameButton(
                text: 'CONTINUE',
                variant: GameButtonVariant.primary,
                onPressed: onNext ?? () {},
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPerkCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String desc,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0xFFE2E8F0),
            blurRadius: 0,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: iconColor, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    color: const Color(0xFF64748B),
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot({required bool isActive}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      width: isActive ? 24 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF06B6D4) : const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(9999),
      ),
    );
  }
}
