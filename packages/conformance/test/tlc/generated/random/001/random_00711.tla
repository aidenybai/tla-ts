(*---
description: Evaluates a random bool expression, seed 262, number 711.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00711 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b1177 \in ({(b1178 + -1) : b1178 \in ({1, 2} \cup 1..3)} \ ({[a |-> 1], 0} \ {-1, TRUE})) : ((SelectSeq(<<>>, LAMBDA e : e > 0) = (CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE)) /\ (~(0 < b1177)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00711 failed.
    Attempted to check equality of integer -1 with non-integer:
    [a |-> 1]
---*)
