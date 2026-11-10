(*---
description: Evaluates a random record expression, seed 262, number 1039.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (3 - 1), b |-> (TRUE /\ TRUE)] EXCEPT !.a = Cardinality((7 .. 0))] EXCEPT !.a = ((LET b1667 == {2, 1, 3} IN b1667 \div (2147483647 * 2147483647)) \div Len([<<5, 6>> EXCEPT ![1] = 7]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01039 failed.
    2178:0 Overflow when computing 2147483647*2147483647
---*)
