import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/tactile_game_button.dart';
import '../widgets/animated_dolphin_mascot.dart';

/// Screen 06: Daily Commitment Pace Target Screen
/// Allows learners to calibrate their daily bite-sized goal (Casual 5m to Intense 20m).
class Screen06DailyPaceTarget extends StatefulWidget {
  final VoidCallback? onNext;

  const Screen06DailyPaceTarget({super.key, this.onNext});

  @override
  State<Screen06DailyPaceTarget> createState() => _Screen06DailyPaceTargetState();
}

class _Screen06DailyPaceTargetState extends State<Screen06DailyPaceTarget> {
  int _selectedTargetIndex = 1; // Default to 'Regular'

  final List<Map<String, dynamic>> _targets = [
    {
      'icon': '🐢',
      'label': 'Casual',
      'time': '5 min / day',
      'xp': '10 XP',
      'isPopular': false,
    },
    {
      'icon': '🐬',
      'label': 'Regular',
      'time': '10 min / day',
      'xp': '20 XP',
      'isPopular': true,
    },
    {
      'icon': '🚀',
      'label': 'Serious',
      'time': '15 min / day',
      'xp': '30 XP',
      'isPopular': false,
    },
    {
      'icon': '⚡',
      'label': 'Intense',
      'time': '20 min / day',
      'xp': '50 XP',
      'isPopular': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(color: Color(0xFF64748B)),
        centerTitle: true,
        title: ClipRRect(
          borderRadius: BorderRadius.circular(9999),
          child: const SizedBox(
            width: 140,
            height: 10,
            child: LinearProgressIndicator(
              value: 0.65,
              backgroundColor: Color(0xFFE2E8F0),
              valueColor: AlwaysStoppedAnimation(Color(0xFF06B6D4)),
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const AnimatedDolphinMascot(
                    size: 82,
                    pose: MascotPose.reading,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Choose your daily target',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF1E293B),
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'A little every day adds up to big fluency.',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Targets Column
              Expanded(
                child: ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  itemCount: _targets.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final target = _targets[index];
                    final isSelected = _selectedTargetIndex == index;
                    final isPopular = target['isPopular'] as bool;

                    return GestureDetector(
                      onTap: () => setState(() => _selectedTargetIndex = index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFE0F2FE) : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
                            width: isSelected ? 2.5 : 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: isSelected
                                  ? const Color(0xFF0284C7).withOpacity(0.18)
                                  : const Color(0xFFE2E8F0),
                              blurRadius: isSelected ? 4 : 0,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Text(target['icon'] as String, style: const TextStyle(fontSize: 32)),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        target['label'] as String,
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFF1E293B),
                                        ),
                                      ),
                                      if (isPopular) ...[
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFEF3C7),
                                            borderRadius: BorderRadius.circular(9999),
                                            border: Border.all(color: const Color(0xFFFDE68A)),
                                          ),
                                          child: Text(
                                            'RECOMMENDED',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w900,
                                              color: const Color(0xFFB45309),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    target['time'] as String,
                                    style: GoogleFonts.outfit(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFF0284C7)
                                    : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                target['xp'] as String,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: isSelected ? Colors.white : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              TactileGameButton(
                text: 'SET DAILY GOAL',
                variant: GameButtonVariant.primary,
                onPressed: widget.onNext ?? () {},
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }
}
