---------------------------- MODULE LetParameters ----------------------------
EXTENDS Naturals

VARIABLE x

Init == x = 0

Next ==
  LET W(width) == INSTANCE Window WITH Width <- width, position <- x
  IN /\ W(3)!InWindow
     /\ W(3)!Advance

Bounded == x < 3
=============================================================================
