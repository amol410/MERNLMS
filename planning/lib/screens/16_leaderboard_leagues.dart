import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Screen 16: Oceanic Leagues & Leaderboard Screen
/// Weekly competitive leagues (Lagoon, Coral Reef, Open Ocean, Deep Trench, Atlantis).
class Screen16LeaderboardLeagues extends StatelessWidget {
  final VoidCallback? onBack;

  const Screen16LeaderboardLeagues({super.key, this.onBack});

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> rankings = [
      {'rank': 1, 'name': 'Lukas Becker', 'xp': 890, 'flag': '🇩🇪', 'avatar': '🐬'},
      {'rank': 2, 'name': 'Sarah Jenkins', 'xp': 740, 'flag': '🇬🇧', 'avatar': '🦊'},
      {'rank': 3, 'name': 'Mateo Rossi', 'xp': 680, 'flag': '🇮🇹', 'avatar': '🦁'},
      {'rank': 4, 'name': 'Elena Rostova', 'xp': 590, 'flag': '🇷🇺', 'avatar': '🐼'},
      {'rank': 5, 'name': 'Kaito Tanaka', 'xp': 540, 'flag': '🇯🇵', 'avatar': '🐯'},
      {'rank': 6, 'name': 'Amira Said', 'xp': 510, 'flag': '🇪🇬', 'avatar': '🐨'},
      {'rank': 7, 'name': 'You (Learner)', 'xp': 480, 'flag': '🇮🇳', 'avatar': '🐬', 'isUser': true},
      {'rank': 8, 'name': 'David Miller', 'xp': 410, 'flag': '🇺🇸', 'avatar': '🐻'},
      {'rank': 9, 'name': 'Chloe Laurent', 'xp': 390, 'flag': '🇫🇷', 'avatar': '🦄'},
      {'rank': 10, 'name': 'Carlos Silva', 'xp': 350, 'flag': '🇧🇷', 'avatar': '🐵'},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF64748B)),
          onPressed: onBack ?? () {},
        ),
        title: Text(
          'Oceanic Leagues',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF1E293B),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // League Header Banner
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0284C7), Color(0xFF06B6D4)],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0xFF0284C7),
                    blurRadius: 0,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Text('🪸', style: TextStyle(fontSize: 26)),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'CORAL REEF LEAGUE',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Top 10 advance to Open Ocean • 2d 14h left',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFFBAE6FD),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Leaderboard List
            Expanded(
              child: ListView.separated(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                itemCount: rankings.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final item = rankings[index];
                  final isUser = item['isUser'] == true;
                  final rank = item['rank'] as int;

                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isUser ? const Color(0xFFE0F2FE) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isUser ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
                        width: isUser ? 2 : 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isUser ? const Color(0xFF0284C7).withOpacity(0.15) : const Color(0xFFE2E8F0),
                          blurRadius: 0,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        // Rank Number or Medal
                        SizedBox(
                          width: 28,
                          child: Text(
                            rank == 1 ? '🥇' : (rank == 2 ? '🥈' : (rank == 3 ? '🥉' : '$rank')),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Avatar Emoji
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: const Color(0xFFF1F5F9),
                          child: Text(item['avatar'] as String, style: const TextStyle(fontSize: 18)),
                        ),
                        const SizedBox(width: 12),
                        // Username + Flag
                        Expanded(
                          child: Row(
                            children: [
                              Text(
                                item['name'] as String,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: isUser ? FontWeight.w900 : FontWeight.w700,
                                  color: isUser ? const Color(0xFF0284C7) : const Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(item['flag'] as String),
                            ],
                          ),
                        ),
                        // XP Total
                        Text(
                          '${item['xp']} XP',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFFF59E0B),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
