---------------------------- MODULE WaterJugs ----------------------------
EXTENDS Naturals

CONSTANTS SmallCapacity, LargeCapacity, Goal

VARIABLES small, large

vars == <<small, large>>

Min(a, b) == IF a < b THEN a ELSE b

TypeOK == /\ small \in 0..SmallCapacity
          /\ large \in 0..LargeCapacity

Init == /\ small = 0
        /\ large = 0

FillSmall == /\ small' = SmallCapacity
             /\ large' = large

FillLarge == /\ large' = LargeCapacity
             /\ UNCHANGED small

EmptySmall == /\ small' = 0
              /\ UNCHANGED large

EmptyLarge == /\ large' = 0
              /\ UNCHANGED small

PourSmallIntoLarge ==
  LET poured == Min(small, LargeCapacity - large)
  IN  /\ small' = small - poured
      /\ large' = large + poured

PourLargeIntoSmall ==
  LET poured == Min(large, SmallCapacity - small)
  IN  /\ large' = large - poured
      /\ small' = small + poured

Next == \/ FillSmall
        \/ FillLarge
        \/ EmptySmall
        \/ EmptyLarge
        \/ PourSmallIntoLarge
        \/ PourLargeIntoSmall

Spec == Init /\ [][Next]_vars

GoalNotReached == large # Goal
=============================================================================
