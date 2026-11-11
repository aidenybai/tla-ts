(*---
description: Evaluates a random bool expression, seed 262, number 1074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (TRUE /\ FALSE) -> Cardinality(Nat) [] OTHER -> Cardinality({2, 1, 3}) = (LET b1714 == 2147483647 IN 1 + (0 + 3))) \/ (\E b1715 \in ((0 .. 0) \ ({2, 1, 3} \ SUBSET {1})) : (<<b1715, b1715>> = (2..1 @@ [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01074 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
