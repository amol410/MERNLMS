import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/animated_dolphin_mascot.dart';
import '../widgets/tactile_game_button.dart';

/// Screen 14: Lesson Complete Celebration Screen
/// Dopamine reward delivery showing XP earned, accuracy %, time elapsed, and celebratory mascot.
class Screen14LessonCompleteCelebration extends StatelessWidget {
  final int xpGained;
  final int accuracyPercent;
  final String timeTaken;
  final VoidCallback? onContinue;

  const Screen14LessonCompleteCelebration({
    super.key,
    this.xpGained = 15,
    this.accuracyPercent = 94,
    this.timeTaken = '1:45',
    this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              const Spacer(),

              // Celebratory Mascot with Leaping Splash
              const AnimatedDolphinMascot(
                size: 175,
                pose: MascotPose.jump,
              ),
              const SizedBox(height: 24),

              Text(
                'LESSON COMPLETE!',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFFF59E0B),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'You\'re making amazing progress in German!',
                style: GoogleFonts.outfit(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 36),

              // 3 Performance Metrics Cards
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      label: 'TOTAL XP',
                      value: '+$xpGained',
                      color: const Color(0xFFF59E0B),
                      icon: Icons.bolt_rounded,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      label: 'ACCURACY',
                      value: '$accuracyPercent%',
                      color: const Color(0xFF10B981),
                      icon: Icons.track_changes_rounded,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      label: 'TIME',
                      value: timeTaken,
                      color: const Color(0xFF06B6D4),
                      icon: Icons.timer_outlined,
                    ),
                  ),
                ],
              ),

              const Spacer(),

              TactileGameButton(
                text: 'CONTINUE',
                variant: GameButtonVariant.success,
                height: 56,
                fontSize: 16,
                onPressed: onContinue ?? () {},
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String label,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withOpacity(0.3), width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.12),
            blurRadius: 0,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF94A3B8),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
