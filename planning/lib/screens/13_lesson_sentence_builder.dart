import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/tactile_game_button.dart';
import '../widgets/duo_feedback_sheet.dart';

/// Screen 13: Lesson Challenge — Sentence Builder
/// Word ordering and syntax puzzle where learners construct correct sentences from scrambled tiles.
class Screen13LessonSentenceBuilder extends StatefulWidget {
  final VoidCallback? onComplete;

  const Screen13LessonSentenceBuilder({super.key, this.onComplete});

  @override
  State<Screen13LessonSentenceBuilder> createState() => _Screen13LessonSentenceBuilderState();
}

class _Screen13LessonSentenceBuilderState extends State<Screen13LessonSentenceBuilder> {
  final String _prompt = 'The water is cold.';
  final List<String> _bankWords = ['Das', 'Wasser', 'ist', 'kalt.', 'Kaffee', 'heiß'];
  final List<String> _correctSentence = ['Das', 'Wasser', 'ist', 'kalt.'];
  final List<String> _assembled = [];

  bool? _isCorrect;

  void _onWordTap(String word) {
    setState(() {
      if (_assembled.contains(word)) {
        _assembled.remove(word);
      } else {
        _assembled.add(word);
      }
      _isCorrect = null;
    });
  }

  void _checkAnswer() {
    if (_assembled.length != _correctSentence.length) {
      setState(() => _isCorrect = false);
      return;
    }
    bool match = true;
    for (int i = 0; i < _correctSentence.length; i++) {
      if (_assembled[i] != _correctSentence[i]) {
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
              value: 0.95,
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
                      'Translate this sentence',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF1E293B),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // English Prompt Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                      ),
                      child: Text(
                        _prompt,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Construction Canvas
                    Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(minHeight: 110),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                      ),
                      child: _assembled.isEmpty
                          ? Center(
                              child: Text(
                                'Tap words below to build sentence',
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                            )
                          : Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _assembled.map((word) {
                                return _buildTile(
                                  text: word,
                                  isSelected: true,
                                  onTap: () => _onWordTap(word),
                                );
                              }).toList(),
                            ),
                    ),
                    const SizedBox(height: 32),

                    // Bank of Word Tiles
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: _bankWords.map((word) {
                        final isUsed = _assembled.contains(word);
                        return _buildTile(
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

            // Bottom Result
            if (_isCorrect != null)
              DuoFeedbackSheet(
                isSuccess: _isCorrect!,
                title: _isCorrect! ? 'Outstanding!' : 'Solution:',
                subtitle: _isCorrect!
                    ? 'Meaning: The water is cold.'
                    : 'Das Wasser ist kalt.',
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
                  onPressed: _assembled.isNotEmpty ? _checkAnswer : null,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTile({
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
