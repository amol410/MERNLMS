import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/tactile_game_button.dart';
import '../widgets/duo_feedback_sheet.dart';
import '../widgets/animated_dolphin_mascot.dart';

/// Screen 10: Lesson Challenge — Match the Pairs
/// Dual-column rapid-fire vocabulary matching challenge with visual feedback.
class Screen10LessonWordMatch extends StatefulWidget {
  final VoidCallback? onComplete;

  const Screen10LessonWordMatch({super.key, this.onComplete});

  @override
  State<Screen10LessonWordMatch> createState() => _Screen10LessonWordMatchState();
}

class _Screen10LessonWordMatchState extends State<Screen10LessonWordMatch> {
  final List<String> _germanWords = ['Guten Tag', 'Danke', 'Bitte', 'Wasser'];
  final List<String> _englishWords = ['Thank you', 'Water', 'Hello', 'Please'];

  final Map<String, String> _solutionPairs = {
    'Guten Tag': 'Hello',
    'Danke': 'Thank you',
    'Bitte': 'Please',
    'Wasser': 'Water',
  };

  final Set<String> _matchedGerman = {};
  final Set<String> _matchedEnglish = {};

  String? _selectedGerman;
  String? _selectedEnglish;
  bool _isFinished = false;

  void _onGermanTap(String word) {
    if (_matchedGerman.contains(word)) return;
    setState(() {
      _selectedGerman = word;
      _checkMatch();
    });
  }

  void _onEnglishTap(String word) {
    if (_matchedEnglish.contains(word)) return;
    setState(() {
      _selectedEnglish = word;
      _checkMatch();
    });
  }

  void _checkMatch() {
    if (_selectedGerman != null && _selectedEnglish != null) {
      if (_solutionPairs[_selectedGerman] == _selectedEnglish) {
        // Correct match!
        _matchedGerman.add(_selectedGerman!);
        _matchedEnglish.add(_selectedEnglish!);
        _selectedGerman = null;
        _selectedEnglish = null;

        if (_matchedGerman.length == _germanWords.length) {
          _isFinished = true;
        }
      } else {
        // Wrong match - clear selection after short delay
        Future.delayed(const Duration(milliseconds: 400), () {
          if (mounted) {
            setState(() {
              _selectedGerman = null;
              _selectedEnglish = null;
            });
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = _matchedGerman.length / _germanWords.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const CloseButton(color: Color(0xFF94A3B8)),
        title: ClipRRect(
          borderRadius: BorderRadius.circular(9999),
          child: SizedBox(
            height: 12,
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation(Color(0xFF10B981)),
            ),
          ),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Row(
              children: [
                Icon(Icons.bubble_chart_rounded, color: Color(0xFF06B6D4), size: 22),
                SizedBox(width: 4),
                Text(
                  '5',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF06B6D4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const AnimatedDolphinMascot(
                          size: 72,
                          pose: MascotPose.letters,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Tap the matching pairs',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF1E293B),
                              letterSpacing: -0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Two Matching Columns
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left: German Words
                        Expanded(
                          child: Column(
                            children: _germanWords.map((word) {
                              final isMatched = _matchedGerman.contains(word);
                              final isSelected = _selectedGerman == word;
                              return _buildMatchTile(
                                text: word,
                                isSelected: isSelected,
                                isMatched: isMatched,
                                onTap: () => _onGermanTap(word),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(width: 14),

                        // Right: English Words
                        Expanded(
                          child: Column(
                            children: _englishWords.map((word) {
                              final isMatched = _matchedEnglish.contains(word);
                              final isSelected = _selectedEnglish == word;
                              return _buildMatchTile(
                                text: word,
                                isSelected: isSelected,
                                isMatched: isMatched,
                                onTap: () => _onEnglishTap(word),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Success Banner when all 4 matched
            if (_isFinished)
              DuoFeedbackSheet(
                isSuccess: true,
                title: 'Great job!',
                subtitle: 'All pairs matched cleanly.',
                buttonText: 'CONTINUE',
                onContinue: widget.onComplete ?? () {},
              )
            else
              Padding(
                padding: const EdgeInsets.all(20),
                child: TactileGameButton(
                  text: 'MATCH ALL PAIRS',
                  variant: GameButtonVariant.primary,
                  onPressed: null, // Disabled until finished
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMatchTile({
    required String text,
    required bool isSelected,
    required bool isMatched,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: GestureDetector(
        onTap: isMatched ? null : onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: double.infinity,
          height: 60,
          decoration: BoxDecoration(
            color: isMatched
                ? const Color(0xFFE2E8F0).withOpacity(0.5)
                : (isSelected ? const Color(0xFFE0F2FE) : Colors.white),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isMatched
                  ? const Color(0xFFCBD5E1)
                  : (isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0)),
              width: isSelected ? 2.5 : 1.5,
            ),
            boxShadow: isMatched
                ? []
                : [
                    BoxShadow(
                      color: isSelected
                          ? const Color(0xFF0284C7).withOpacity(0.2)
                          : const Color(0xFFE2E8F0),
                      blurRadius: 0,
                      offset: const Offset(0, 3),
                    ),
                  ],
          ),
          child: Center(
            child: Text(
              text,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: isMatched
                    ? const Color(0xFF94A3B8)
                    : (isSelected ? const Color(0xFF0284C7) : const Color(0xFF1E293B)),
                decoration: isMatched ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
