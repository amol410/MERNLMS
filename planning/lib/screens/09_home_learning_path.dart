import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/ocean_status_bar.dart';
import '../widgets/animated_dolphin_mascot.dart';

/// Screen 09: Home Learning Archipelago Screen
/// The core hub of the entire application featuring the gamified serpentine path.
class Screen09HomeLearningPath extends StatefulWidget {
  final VoidCallback? onNodeTap;
  final ValueChanged<int>? onNavTap;

  const Screen09HomeLearningPath({
    super.key,
    this.onNodeTap,
    this.onNavTap,
  });

  @override
  State<Screen09HomeLearningPath> createState() => _Screen09HomeLearningPathState();
}

class _Screen09HomeLearningPathState extends State<Screen09HomeLearningPath> {
  int _currentNavIndex = 0;

  // Node statuses: 'completed', 'active', 'locked', 'chest'
  final List<Map<String, dynamic>> _nodes = [
    {'title': 'Basics 1', 'status': 'completed', 'stars': 3, 'offset': 0.0},
    {'title': 'Greetings', 'status': 'completed', 'stars': 3, 'offset': 0.45},
    {'title': 'Travel', 'status': 'active', 'stars': 1, 'offset': 0.15},
    {'title': 'Treasure Chest', 'status': 'chest', 'stars': 0, 'offset': -0.4},
    {'title': 'Food & Drinks', 'status': 'locked', 'stars': 0, 'offset': -0.1},
    {'title': 'Family', 'status': 'locked', 'stars': 0, 'offset': 0.35},
    {'title': 'Unit Milestone', 'status': 'locked', 'stars': 0, 'offset': 0.0},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Top Gamified Status Bar
            const OceanStatusBar(
              flagEmoji: '🇩🇪',
              streakCount: 7,
              oxygen: 5,
              maxOxygen: 5,
              pearls: 420,
            ),

            // 2. Main Scrollable Archipelago Path
            Expanded(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                children: [
                  // Unit Header Banner
                  _buildUnitBanner(),
                  const SizedBox(height: 32),

                  // Serpentine Stepping Stones
                  for (int i = 0; i < _nodes.length; i++)
                    _buildPathNode(index: i, node: _nodes[i]),
                ],
              ),
            ),

            // 3. Bottom Gamified Navigation Bar
            _buildBottomNav(),
          ],
        ),
      ),
    );
  }

  Widget _buildUnitBanner() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'UNIT 1',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFFBAE6FD),
                  letterSpacing: 1.0,
                ),
              ),
              const Icon(Icons.menu_book_rounded, color: Colors.white, size: 20),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Introductions & Daily Greetings',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          // Unit Progress
          ClipRRect(
            borderRadius: BorderRadius.circular(9999),
            child: const LinearProgressIndicator(
              value: 0.65,
              minHeight: 10,
              backgroundColor: Color(0xFF0369A1),
              valueColor: AlwaysStoppedAnimation(Color(0xFFF59E0B)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPathNode({required int index, required Map<String, dynamic> node}) {
    final status = node['status'] as String;
    final offset = (node['offset'] as double) * 120.0;
    final isActive = status == 'active';
    final isCompleted = status == 'completed';
    final isChest = status == 'chest';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Transform.translate(
        offset: Offset(offset, 0),
        child: Column(
          children: [
            // Mascot sits on active node with adventure backpack
            if (isActive) ...[
              const AnimatedDolphinMascot(
                size: 92,
                pose: MascotPose.backpack,
              ),
              const SizedBox(height: 6),
            ],

            // Stepping Stone Node Button
            GestureDetector(
              onTap: widget.onNodeTap ?? () {},
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Pulse Ring around active node
                  if (isActive)
                    Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF06B6D4).withOpacity(0.2),
                      ),
                    ),

                  Container(
                    width: isChest ? 68 : 74,
                    height: isChest ? 68 : 74,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? const Color(0xFFF59E0B)
                          : (isActive
                              ? const Color(0xFF06B6D4)
                              : (isChest ? const Color(0xFF8B5CF6) : const Color(0xFFE2E8F0))),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isCompleted
                            ? const Color(0xFFD97706)
                            : (isActive
                                ? const Color(0xFF0891B2)
                                : (isChest ? const Color(0xFF7C3AED) : const Color(0xFFCBD5E1))),
                        width: 4,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isCompleted
                              ? const Color(0xFFD97706)
                              : (isActive
                                  ? const Color(0xFF0891B2)
                                  : (isChest ? const Color(0xFF7C3AED) : const Color(0xFF94A3B8))),
                          blurRadius: 0,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        isCompleted
                            ? Icons.star_rounded
                            : (isActive
                                ? Icons.play_arrow_rounded
                                : (isChest ? Icons.card_giftcard_rounded : Icons.lock_rounded)),
                        color: (status == 'locked') ? const Color(0xFF94A3B8) : Colors.white,
                        size: 34,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Text(
              node['title'] as String,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: isActive ? const Color(0xFF0284C7) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    final navItems = [
      {'icon': Icons.home_rounded, 'label': 'Path'},
      {'icon': Icons.leaderboard_rounded, 'label': 'Leagues'},
      {'icon': Icons.flag_rounded, 'label': 'Quests'},
      {'icon': Icons.storefront_rounded, 'label': 'Shop'},
      {'icon': Icons.person_rounded, 'label': 'Profile'},
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 1.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(navItems.length, (index) {
          final isSelected = _currentNavIndex == index;
          final item = navItems[index];

          return GestureDetector(
            onTap: () {
              setState(() => _currentNavIndex = index);
              widget.onNavTap?.call(index);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    item['icon'] as IconData,
                    color: isSelected ? const Color(0xFF0284C7) : const Color(0xFF94A3B8),
                    size: 26,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item['label'] as String,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: isSelected ? const Color(0xFF0284C7) : const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
