import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/animated_dolphin_mascot.dart';
import '../widgets/tactile_game_button.dart';

/// Screen 05: Goal & Motivation Screen
/// Personalizes the learner's journey by identifying their core driving motivation.
class Screen05GoalMotivation extends StatefulWidget {
  final String language;
  final VoidCallback? onNext;

  const Screen05GoalMotivation({
    super.key,
    this.language = 'German',
    this.onNext,
  });

  @override
  State<Screen05GoalMotivation> createState() => _Screen05GoalMotivationState();
}

class _Screen05GoalMotivationState extends State<Screen05GoalMotivation> {
  int _selectedIndex = 0;

  final List<Map<String, String>> _reasons = [
    {
      'icon': '✈️',
      'title': 'Travel & Exploration',
      'desc': 'Navigate airports, order food, and speak with locals confidently.',
    },
    {
      'icon': '💼',
      'title': 'Career & Opportunities',
      'desc': 'Boost your resume and communicate with international colleagues.',
    },
    {
      'icon': '🧠',
      'title': 'Brain Training & Fun',
      'desc': 'Sharpen memory, build discipline, and keep your mind active.',
    },
    {
      'icon': '🎓',
      'title': 'School & Academic Success',
      'desc': 'Ace your classes, pass exams, and prepare for studying abroad.',
    },
    {
      'icon': '💬',
      'title': 'Family & Friends',
      'desc': 'Deepen bonds by speaking their native language with love.',
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
              value: 0.45,
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
              // Mascot Header Row
              Row(
                children: [
                  const AnimatedDolphinMascot(
                    size: 70,
                    accessory: MascotAccessory.backpack,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                      ),
                      child: Text(
                        'Why are you learning ${widget.language}?',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Options List
              Expanded(
                child: ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  itemCount: _reasons.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = _reasons[index];
                    final isSelected = _selectedIndex == index;

                    return GestureDetector(
                      onTap: () => setState(() => _selectedIndex = index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFE0F2FE) : Colors.white,
                          borderRadius: BorderRadius.circular(18),
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
                            Text(item['icon']!, style: const TextStyle(fontSize: 28)),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['title']!,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF1E293B),
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    item['desc']!,
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      color: const Color(0xFF64748B),
                                      height: 1.3,
                                    ),
                                  ),
                                ],
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
                      ),
                    );
                  },
                ),
              ),

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
}
