import 'package:flutter_test/flutter_test.dart';
import 'package:lingo_dolphin_planning/main.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const LingoDolphinPlanningApp());
    expect(find.byType(LingoDolphinPlanningApp), findsOneWidget);
  });
}
