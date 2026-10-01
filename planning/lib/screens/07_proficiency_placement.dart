import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/animated_dolphin_mascot.dart';
import '../widgets/tactile_game_button.dart';

/// Screen 07: Proficiency Level & Placement Choice
/// Determines starting position on the learning path (Beginner vs Placement Quiz).
class Screen07ProficiencyPlacement extends StatefulWidget {
  final VoidCallback? onNext;

  const Screen07ProficiencyPlacement({super.key, this.onNext});

  @override
  State<Screen07ProficiencyPlacement> createState() => _Screen07ProficiencyPlacementState();
}

class _Screen07ProficiencyPlacementState extends State<Screen07ProficiencyPlacement> {
  int _selectedChoice = 0; // 0 = Beginner, 1 = Placement Quiz

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
              value: 0.85,
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
              Text(
                'Where would you like to begin?',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF1E293B),
                  letterSpacing: -0.6,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'We will tailor your learning path to match your experience.',
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 28),

              // Option 1: Brand New Beginner
              _buildChoiceCard(
                index: 0,
                icon: Icons.eco_rounded,
                iconColor: const Color(0xFF10B981),
                title: 'Start from scratch',
                subtitle: 'Learn common greetings, alphabet, and foundational German basics.',
                badge: 'BEGINNER',
              ),
              const SizedBox(height: 16),

              // Option 2: Placement Diagnostic Test
              _buildChoiceCard(
                index: 1,
                icon: Icons.tune_rounded,
                iconColor: const Color(0xFF6366F1),
                title: 'Find my level (2 min test)',
                subtitle: 'Already know some words? Answer 6 quick questions to skip ahead.',
                badge: 'PLACEMENT',
              ),

              const Spacer(),

              // Animated Mascot studying/reading
              const Center(
                child: AnimatedDolphinMascot(
                  size: 110,
                  pose: MascotPose.reading,
                ),
              ),
              const SizedBox(height: 16),

              TactileGameButton(
                text: 'CONTINUE',
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

  Widget _buildChoiceCard({
    required int index,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String badge,
  }) {
    final isSelected = _selectedChoice == index;

    return GestureDetector(
      onTap: () => setState(() => _selectedChoice = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE0F2FE) : Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
            width: isSelected ? 2.5 : 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected ? const Color(0xFF0284C7).withOpacity(0.18) : const Color(0xFFE2E8F0),
              blurRadius: isSelected ? 4 : 0,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      if (isSelected)
                        const Icon(
                          Icons.check_circle_rounded,
                          color: Color(0xFF0284C7),
                          size: 22,
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
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
      ),
    );
  }
}
