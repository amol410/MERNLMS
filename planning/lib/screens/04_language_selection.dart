import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/tactile_game_button.dart';
import '../widgets/animated_dolphin_mascot.dart';

/// Screen 04: Language Selection Screen
/// Interactive grid of target languages with learner metrics and select state.
class Screen04LanguageSelection extends StatefulWidget {
  final ValueChanged<String>? onLanguageSelected;
  final VoidCallback? onNext;

  const Screen04LanguageSelection({
    super.key,
    this.onLanguageSelected,
    this.onNext,
  });

  @override
  State<Screen04LanguageSelection> createState() => _Screen04LanguageSelectionState();
}

class _Screen04LanguageSelectionState extends State<Screen04LanguageSelection> {
  String _selectedLanguage = 'German';

  final List<Map<String, String>> _languages = [
    {'name': 'German', 'native': 'Deutsch', 'flag': '🇩🇪', 'learners': '240k learners'},
    {'name': 'Spanish', 'native': 'Español', 'flag': '🇪🇸', 'learners': '510k learners'},
    {'name': 'French', 'native': 'Français', 'flag': '🇫🇷', 'learners': '380k learners'},
    {'name': 'Japanese', 'native': '日本語', 'flag': '🇯🇵', 'learners': '290k learners'},
    {'name': 'Italian', 'native': 'Italiano', 'flag': '🇮🇹', 'learners': '170k learners'},
    {'name': 'English', 'native': 'English', 'flag': '🇬🇧', 'learners': '620k learners'},
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
              value: 0.25,
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
                    pose: MascotPose.flag,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'What would you like to learn?',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF1E293B),
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Choose a language to begin.',
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
              const SizedBox(height: 16),

              // Language Grid
              Expanded(
                child: GridView.builder(
                  physics: const BouncingScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: 1.15,
                  ),
                  itemCount: _languages.length,
                  itemBuilder: (context, index) {
                    final lang = _languages[index];
                    final isSelected = _selectedLanguage == lang['name'];

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedLanguage = lang['name']!;
                        });
                        widget.onLanguageSelected?.call(_selectedLanguage);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFE0F2FE) : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFF0284C7)
                                : const Color(0xFFE2E8F0),
                            width: isSelected ? 2.5 : 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: isSelected
                                  ? const Color(0xFF0284C7).withOpacity(0.2)
                                  : const Color(0xFFE2E8F0),
                              blurRadius: isSelected ? 4 : 0,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  lang['flag']!,
                                  style: const TextStyle(fontSize: 32),
                                ),
                                if (isSelected)
                                  const Icon(
                                    Icons.check_circle_rounded,
                                    color: Color(0xFF0284C7),
                                    size: 22,
                                  ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  lang['name']!,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF1E293B),
                                  ),
                                ),
                                Text(
                                  lang['learners']!,
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              TactileGameButton(
                text: 'CONTINUE WITH $_selectedLanguage'.toUpperCase(),
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
