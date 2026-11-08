---- MODULE RecordMembership ----
EXTENDS Naturals
VARIABLES slot
Slots == [low: 0..1000, high: 0..1000, marks: SUBSET (1..10)]
Init == slot = [low |-> 0, high |-> 0, marks |-> {}]
Next ==
  \/ /\ slot.low < 3
     /\ slot' = [slot EXCEPT !.low = @ + 1, !.marks = @ \cup {slot.low + 1}]
  \/ /\ slot.high < 2
     /\ slot' = [slot EXCEPT !.high = @ + 1]
TypeOK == slot \in Slots
====
