import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/animated_dolphin_mascot.dart';
import '../widgets/tactile_game_button.dart';

/// Screen 08: Account Creation & Guest Mode Screen
/// Low-friction profile registration with guest fallback so students can dive in immediately.
class Screen08AuthSignupPrompt extends StatelessWidget {
  final VoidCallback? onSignUp;
  final VoidCallback? onContinueGuest;
  final VoidCallback? onLogin;

  const Screen08AuthSignupPrompt({
    super.key,
    this.onSignUp,
    this.onContinueGuest,
    this.onLogin,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          physics: const BouncingScrollPhysics(),
          child: Column(
            children: [
              const SizedBox(height: 10),

              // Animated Mascot
              const AnimatedDolphinMascot(
                size: 110,
                accessory: MascotAccessory.none,
                isCelebrating: true,
              ),
              const SizedBox(height: 16),

              Text(
                'Create your profile',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF1E293B),
                  letterSpacing: -0.6,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Save your streak, earn pearls, and compete with friends across all your devices.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  color: const Color(0xFF64748B),
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 28),

              // Social Sign In Button 1: Google
              _buildSocialButton(
                icon: Icons.g_mobiledata_rounded,
                iconColor: const Color(0xFFEA4335),
                label: 'CONTINUE WITH GOOGLE',
                onTap: onSignUp ?? () {},
              ),
              const SizedBox(height: 16),

              // Divider
              Row(
                children: [
                  const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'OR EMAIL',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF94A3B8),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                ],
              ),
              const SizedBox(height: 20),

              // Email & Password Fields
              _buildInputField(hint: 'Email address', icon: Icons.mail_outline_rounded),
              const SizedBox(height: 12),
              _buildInputField(hint: 'Password (min 6 characters)', icon: Icons.lock_outline_rounded, isPassword: true),
              const SizedBox(height: 24),

              // Create Account Button
              TactileGameButton(
                text: 'CREATE ACCOUNT',
                variant: GameButtonVariant.primary,
                onPressed: onSignUp ?? () {},
              ),
              const SizedBox(height: 14),

              // Continue As Guest
              TactileGameButton(
                text: 'LATER (CONTINUE AS GUEST)',
                variant: GameButtonVariant.outline,
                onPressed: onContinueGuest ?? () {},
              ),
              const SizedBox(height: 16),

              // Already have an account login link
              GestureDetector(
                onTap: onLogin ?? () {},
                child: Text(
                  'Already have an account? Sign In',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0284C7),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required Color iconColor,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
          boxShadow: const [
            BoxShadow(
              color: Color(0xFFE2E8F0),
              blurRadius: 0,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 26, color: iconColor),
            const SizedBox(width: 10),
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF1E293B),
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField({
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
      ),
      child: TextField(
        obscureText: isPassword,
        style: GoogleFonts.plusJakartaSans(fontSize: 14, color: const Color(0xFF1E293B)),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 14),
          prefixIcon: Icon(icon, color: const Color(0xFF94A3B8), size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }
}
