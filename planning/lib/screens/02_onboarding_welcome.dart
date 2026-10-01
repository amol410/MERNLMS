import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/animated_dolphin_mascot.dart';
import '../widgets/tactile_game_button.dart';

/// Screen 02: Onboarding Welcome Screen
/// Mascot introduction with comic speech bubble and primary call to action.
class Screen02OnboardingWelcome extends StatelessWidget {
  final VoidCallback? onNext;
  final VoidCallback? onLogin;

  const Screen02OnboardingWelcome({super.key, this.onNext, this.onLogin});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              // Top Dots Progress
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildDot(isActive: true),
                  const SizedBox(width: 8),
                  _buildDot(isActive: false),
                  const SizedBox(width: 8),
                  _buildDot(isActive: false),
                ],
              ),
              const Spacer(),

              // Comic Speech Bubble from Mascot
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0xFFE2E8F0),
                      blurRadius: 0,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Text(
                  'Hi there! I\'m Echo.\nI\'ll help you learn to speak your dream language naturally in just 5 minutes a day!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Animated Mascot Waving with friendly wink
              const AnimatedDolphinMascot(
                size: 160,
                pose: MascotPose.waving,
              ),

              const Spacer(),

              // Primary Action: GET STARTED
              TactileGameButton(
                text: 'GET STARTED',
                variant: GameButtonVariant.primary,
                onPressed: onNext ?? () {},
              ),
              const SizedBox(height: 14),

              // Secondary Action: I ALREADY HAVE AN ACCOUNT
              TactileGameButton(
                text: 'I ALREADY HAVE AN ACCOUNT',
                variant: GameButtonVariant.outline,
                onPressed: onLogin ?? () {},
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
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
