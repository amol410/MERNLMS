import 'package:flutter/material.dart';
import 'screens/screen_navigator_hub.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LingoDolphinPlanningApp());
}

class LingoDolphinPlanningApp extends StatelessWidget {
  const LingoDolphinPlanningApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LingoDolphin Planning Hub',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0284C7),
          primary: const Color(0xFF0284C7),
        ),
        useMaterial3: true,
      ),
      home: const ScreenNavigatorHub(),
    );
  }
}
