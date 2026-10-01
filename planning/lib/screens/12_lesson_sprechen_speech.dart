import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/animated_dolphin_mascot.dart';
import '../widgets/duo_feedback_sheet.dart';

/// Screen 12: Lesson Challenge — Sprechen Speech & Character Lip-Sync
/// Spoken pronunciation challenge featuring Echo with dynamic lip-sync and live dictation.
class Screen12LessonSprechenSpeech extends StatefulWidget {
  final VoidCallback? onComplete;

  const Screen12LessonSprechenSpeech({super.key, this.onComplete});

  @override
  State<Screen12LessonSprechenSpeech> createState() => _Screen12LessonSprechenSpeechState();
}

class _Screen12LessonSprechenSpeechState extends State<Screen12LessonSprechenSpeech> {
  bool _isListening = false;
  bool _isAudioPlaying = false;
  bool? _speechPassed;
  String _spokenText = '';

  final List<String> _words = ['Am', 'Samstag', 'brauche', 'ich', 'viel', 'Schlaf.'];
  final String _translation = 'On Saturday I need a lot of sleep.';

  void _togglePlayAudio() {
    setState(() {
      _isAudioPlaying = !_isAudioPlaying;
    });
    if (_isAudioPlaying) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _isAudioPlaying = false);
      });
    }
  }

  void _startSpeaking() {
    setState(() {
      _isListening = true;
      _spokenText = '';
      _speechPassed = null;
    });

    // Simulate speech recognition result after 2.5s
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (mounted && _isListening) {
        setState(() {
          _isListening = false;
          _spokenText = 'Am Samstag brauche ich viel Schlaf';
          _speechPassed = true;
        });
      }
    });
  }

  void _cancelListening() {
    setState(() {
      _isListening = false;
      _spokenText = '';
    });
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
              value: 0.75,
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
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header row: Speak sentence (18px) + Full script button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          'Speak this sentence',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF1E293B),
                            letterSpacing: -0.3,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            showModalBottomSheet(
                              context: context,
                              backgroundColor: Colors.white,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                              ),
                              builder: (ctx) => Padding(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.description_rounded, color: Color(0xFF0284C7)),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Full Script & Dialogue',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 14),
                                    Text(
                                      'A: Hallo Echo! Was machst du am Wochenende?\nB: Am Samstag brauche ich viel Schlaf.',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14,
                                        height: 1.6,
                                        color: const Color(0xFF334155),
                                      ),
                                    ),
                                    const SizedBox(height: 20),
                                  ],
                                ),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0284C7).withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.description_outlined, size: 15, color: Color(0xFF0284C7)),
                                const SizedBox(width: 4),
                                Text(
                                  'Full script',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF0284C7),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // 1. German Target Sentence Card (Karaoke Text)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0xFFE2E8F0),
                            blurRadius: 0,
                            offset: Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _words.map((word) {
                          return Text(
                            word,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0284C7),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 2. Character below karaoke text (size 72) + Speak Audio button beside character
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedDolphinMascot(
                          size: 82,
                          pose: _speechPassed == true
                              ? MascotPose.celebrate
                              : (_speechPassed == false
                                  ? MascotPose.thinking
                                  : MascotPose.headphones),
                          isTalking: _isAudioPlaying,
                          isListening: _isListening,
                        ),
                        const SizedBox(width: 14),
                        GestureDetector(
                          onTap: _togglePlayAudio,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF06B6D4).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: const Color(0xFF06B6D4).withOpacity(0.3),
                                width: 1.5,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _isAudioPlaying
                                      ? Icons.volume_up_rounded
                                      : Icons.volume_up_outlined,
                                  color: const Color(0xFF0891B2),
                                  size: 22,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Play Audio',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0891B2),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    // 3. English Translation
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.translate_rounded, size: 16, color: Color(0xFF64748B)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _translation,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF475569),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 4. Action Area: Tap to Speak Button or Active Listening Canvas
                    if (!_isListening && _speechPassed == null) ...[
                      GestureDetector(
                        onTap: _startSpeaking,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0), width: 2.5),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0xFFE2E8F0),
                                blurRadius: 0,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.mic_rounded, color: Color(0xFF06B6D4), size: 28),
                              const SizedBox(width: 10),
                              Text(
                                'TAP TO SPEAK',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF06B6D4),
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else if (_isListening) ...[
                      // Active Listening Card with Cancel Control
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFF06B6D4), width: 2.5),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFF43F5E),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Listening... speak now in German',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF06B6D4),
                                      ),
                                    ),
                                  ],
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF94A3B8)),
                                  onPressed: _cancelListening,
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const SizedBox(
                              width: 32,
                              height: 32,
                              child: CircularProgressIndicator(
                                strokeWidth: 3,
                                color: Color(0xFF06B6D4),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Bottom Feedback Sheet on Result
            if (_speechPassed != null)
              DuoFeedbackSheet(
                isSuccess: _speechPassed == true,
                title: 'Excellent pronunciation!',
                subtitle: 'Heard: "$_spokenText"\nMeaning: $_translation',
                buttonText: 'CONTINUE',
                onContinue: widget.onComplete ?? () {},
              ),
          ],
        ),
      ),
    );
  }
}
