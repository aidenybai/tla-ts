---------------------------- MODULE LetInstances ----------------------------
EXTENDS Naturals

VARIABLES a, b

Move(width, var) ==
  LET doubled == width * 2
      W == INSTANCE Window WITH Width <- doubled, position <- var
  IN  W!Advance

Init == a = 0 /\ b = 0

Next == \/ Move(2, a) /\ UNCHANGED b
        \/ Move(3, b) /\ UNCHANGED a

Spec == Init /\ [][Next]_<<a, b>>

Safe == a < 8 /\ b < 12

Inside == LET W == INSTANCE Window WITH Width <- 4, position <- a IN W!InWindow
=============================================================================
