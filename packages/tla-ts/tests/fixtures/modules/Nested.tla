---- MODULE Nested ----
EXTENDS Naturals

CONSTANT Limit

VARIABLE count

Wrap(value) == IF value = Limit THEN 0 ELSE value + 1

  ---- MODULE Counter ----
  VARIABLE value

  Step == value' = Wrap(value)

  Done == value = Limit
  ====

C == INSTANCE Counter WITH value <- count

T == INSTANCE Trailing WITH level <- count

Init == count = 0

Next == C!Step

Spec == Init /\ [][Next]_count /\ WF_count(Next)

Bounded == T!Bounded

Wraps == []<>C!Done

TooSmall == count < Limit
====
---- MODULE Trailing ----
EXTENDS Naturals

CONSTANT Limit

VARIABLE level

Bounded == level <= Limit
====
