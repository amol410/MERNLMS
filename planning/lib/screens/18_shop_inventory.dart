import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Screen 18: Pearl & Coral Reef Shop Screen
/// Virtual currency store for Oxygen refills, Streak Freezes, and Mascot cosmetics.
class Screen18ShopInventory extends StatelessWidget {
  final VoidCallback? onBack;

  const Screen18ShopInventory({super.key, this.onBack});

  @override
  Widget build(BuildContext context) {
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
          'Reef Shop',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF1E293B),
          ),
        ),
        centerTitle: true,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF8B5CF6).withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.diamond_rounded, color: Color(0xFF8B5CF6), size: 18),
                const SizedBox(width: 4),
                Text(
                  '520',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF8B5CF6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // Section 1: Power-Ups
            Text(
              'POWER-UPS',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF64748B),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),

            _buildShopItem(
              icon: '❄️',
              title: 'Streak Freeze',
              desc: 'Allows your streak to remain active even if you miss a full day of practice.',
              price: '200',
              status: '2 / 2 EQUIPPED',
              isEquipped: true,
            ),
            const SizedBox(height: 12),

            _buildShopItem(
              icon: '🫧',
              title: 'Refill Oxygen',
              desc: 'Get full energy immediately to practice mistakes without waiting.',
              price: '100',
              status: 'REFILL',
            ),
            const SizedBox(height: 28),

            // Section 2: Outfits for Echo
            Text(
              'ECHO\'S OUTFITS & COSMETICS',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF64748B),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),

            _buildShopItem(
              icon: '🤿',
              title: 'Coral Reef Snorkel',
              desc: 'Equip Echo with high-tech red diving goggles and breathing snorkel.',
              price: 'FREE',
              status: 'UNLOCKED',
              isEquipped: true,
            ),
            const SizedBox(height: 12),

            _buildShopItem(
              icon: '🎩',
              title: 'Gentleman Hat & Bowtie',
              desc: 'Dress Echo in classical Victorian elegance with top hat and bow.',
              price: '400',
              status: 'GET',
            ),
            const SizedBox(height: 12),

            _buildShopItem(
              icon: '👑',
              title: 'Golden Atlantis Crown',
              desc: 'Legendary golden seabed crown with embedded sapphire gems.',
              price: '1,000',
              status: 'GET',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShopItem({
    required String icon,
    required String title,
    required String desc,
    required String price,
    required String status,
    bool isEquipped = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0xFFE2E8F0),
            blurRadius: 0,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(icon, style: const TextStyle(fontSize: 28)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    color: const Color(0xFF64748B),
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    if (price != 'FREE') ...[
                      const Icon(Icons.diamond_rounded, color: Color(0xFF8B5CF6), size: 16),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      price,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: price == 'FREE' ? const Color(0xFF10B981) : const Color(0xFF8B5CF6),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isEquipped ? const Color(0xFFF1F5F9) : const Color(0xFF06B6D4),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isEquipped ? const Color(0xFFCBD5E1) : const Color(0xFF0891B2),
                width: 1.5,
              ),
            ),
            child: Text(
              status,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w900,
                color: isEquipped ? const Color(0xFF64748B) : Colors.white,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
