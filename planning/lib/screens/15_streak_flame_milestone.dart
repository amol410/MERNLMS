import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/tactile_game_button.dart';
import '../widgets/animated_dolphin_mascot.dart';

/// Screen 15: Streak Flame & Calendar Milestone Screen
/// Habit reinforcement screen celebrating daily streak extension and weekly calendar.
class Screen15StreakFlameMilestone extends StatelessWidget {
  final int streakDays;
  final VoidCallback? onContinue;

  const Screen15StreakFlameMilestone({
    super.key,
    this.streakDays = 8,
    this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    final daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final completedDays = [true, true, true, true, true, true, true]; // All completed this week

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              const Spacer(),

              // Roaring Flame Badge + Cheering Mascot
              Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withOpacity(0.25),
                          blurRadius: 28,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.local_fire_department_rounded,
                        color: Color(0xFFF59E0B),
                        size: 88,
                      ),
                    ),
                  ),
                  const Positioned(
                    bottom: -15,
                    right: -30,
                    child: AnimatedDolphinMascot(
                      size: 95,
                      pose: MascotPose.celebrate,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              Text(
                '$streakDays DAY STREAK!',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFFF59E0B),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You\'re 2.3x more likely to become fluent with an 8-day streak!',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 36),

              // Weekly Calendar Tracker Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0xFFE2E8F0),
                      blurRadius: 0,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(7, (index) {
                    final day = daysOfWeek[index];
                    final isChecked = completedDays[index];

                    return Column(
                      children: [
                        Text(
                          day,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: isChecked ? const Color(0xFFF59E0B) : const Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Icon(
                              isChecked ? Icons.check_rounded : Icons.circle,
                              color: isChecked ? Colors.white : const Color(0xFFCBD5E1),
                              size: isChecked ? 20 : 8,
                            ),
                          ),
                        ),
                      ],
                    );
                  }),
                ),
              ),

              const Spacer(),

              TactileGameButton(
                text: 'KEEP IT GOING',
                variant: GameButtonVariant.primary,
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
}
