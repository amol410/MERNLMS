import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/animated_dolphin_mascot.dart';
import '../widgets/tactile_game_button.dart';
import '../widgets/duo_feedback_sheet.dart';

/// Screen 11: Lesson Challenge — Listening & Karaoke Sequence
/// Auditory listening comprehension where learners arrange audio-prompted word tokens.
class Screen11LessonListeningKaraoke extends StatefulWidget {
  final VoidCallback? onComplete;

  const Screen11LessonListeningKaraoke({super.key, this.onComplete});

  @override
  State<Screen11LessonListeningKaraoke> createState() => _Screen11LessonListeningKaraokeState();
}

class _Screen11LessonListeningKaraokeState extends State<Screen11LessonListeningKaraoke> {
  final List<String> _bankWords = ['Kaffee', 'Der', 'schmeckt', 'sehr', 'gut', 'bitte', 'Wasser'];
  final List<String> _correctSequence = ['Der', 'Kaffee', 'schmeckt', 'sehr', 'gut'];
  final List<String> _selectedWords = [];

  bool? _isCorrect;

  void _onWordTap(String word) {
    setState(() {
      if (_selectedWords.contains(word)) {
        _selectedWords.remove(word);
      } else {
        _selectedWords.add(word);
      }
      _isCorrect = null;
    });
  }

  void _checkAnswer() {
    if (_selectedWords.length != _correctSequence.length) {
      setState(() => _isCorrect = false);
      return;
    }
    bool match = true;
    for (int i = 0; i < _correctSequence.length; i++) {
      if (_selectedWords[i] != _correctSequence[i]) {
        match = false;
        break;
      }
    }
    setState(() => _isCorrect = match);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const CloseButton(color: Color(0xFF94A3B8)),
        title: ClipRRect(
          borderRadius: BorderRadius.circular(9999),
          child: const SizedBox(
            height: 12,
            child: LinearProgressIndicator(
              value: 0.50,
              backgroundColor: Color(0xFFE2E8F0),
              valueColor: AlwaysStoppedAnimation(Color(0xFF10B981)),
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Listen and tap what you hear',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF1E293B),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Center Stage: Mascot + Speaker Play Button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const AnimatedDolphinMascot(
                          size: 90,
                          pose: MascotPose.headphones,
                          isListening: true,
                        ),
                        const SizedBox(width: 16),
                        GestureDetector(
                          onTap: () {},
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: const Color(0xFF06B6D4),
                              shape: BoxShape.circle,
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0xFF0891B2),
                                  blurRadius: 0,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Icon(Icons.volume_up_rounded, color: Colors.white, size: 34),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Target Answer Slots
                    Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(minHeight: 110),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                      ),
                      child: _selectedWords.isEmpty
                          ? Center(
                              child: Text(
                                'Tap word tokens from below in order',
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                            )
                          : Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _selectedWords.map((word) {
                                return _buildToken(
                                  text: word,
                                  isSelected: true,
                                  onTap: () => _onWordTap(word),
                                );
                              }).toList(),
                            ),
                    ),
                    const SizedBox(height: 28),

                    // Scrambled Word Bank
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: _bankWords.map((word) {
                        final isUsed = _selectedWords.contains(word);
                        return _buildToken(
                          text: word,
                          isUsed: isUsed,
                          onTap: () => _onWordTap(word),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Validation Sheet
            if (_isCorrect != null)
              DuoFeedbackSheet(
                isSuccess: _isCorrect!,
                title: _isCorrect! ? 'Amazing!' : 'Solution:',
                subtitle: _isCorrect!
                    ? 'Meaning: The coffee tastes very good.'
                    : 'Der Kaffee schmeckt sehr gut.',
                buttonText: 'CONTINUE',
                onContinue: () {
                  if (_isCorrect!) {
                    widget.onComplete?.call();
                  } else {
                    setState(() => _isCorrect = null);
                  }
                },
              )
            else
              Padding(
                padding: const EdgeInsets.all(20),
                child: TactileGameButton(
                  text: 'CHECK ANSWER',
                  variant: GameButtonVariant.success,
                  onPressed: _selectedWords.isNotEmpty ? _checkAnswer : null,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildToken({
    required String text,
    bool isSelected = false,
    bool isUsed = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: isUsed ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isUsed
              ? const Color(0xFFE2E8F0).withOpacity(0.5)
              : (isSelected ? const Color(0xFFE0F2FE) : Colors.white),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isUsed
                ? const Color(0xFFCBD5E1)
                : (isSelected ? const Color(0xFF0284C7) : const Color(0xFFCBD5E1)),
            width: isSelected ? 2 : 1.5,
          ),
          boxShadow: isUsed
              ? []
              : [
                  BoxShadow(
                    color: isSelected
                        ? const Color(0xFF0284C7).withOpacity(0.2)
                        : const Color(0xFFCBD5E1),
                    blurRadius: 0,
                    offset: const Offset(0, 3),
                  ),
                ],
        ),
        child: Text(
          text,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: isUsed
                ? Colors.transparent
                : (isSelected ? const Color(0xFF0284C7) : const Color(0xFF1E293B)),
          ),
        ),
      ),
    );
  }
}
