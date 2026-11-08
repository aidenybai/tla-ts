(*---
description: Evaluates a random bool expression, seed 262, number 7371.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07371 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(SubSeq({1, 2}, 2147483647, 2147483647), LAMBDA p, q : p < q) \cup ([a |-> -1, b |-> FALSE] = [SUBSET {1} EXCEPT !.a = @ + 1..3])) \subseteq ((Head(<<>>) - (-1 + 2147483647)) .. IF (FALSE /\ FALSE) THEN ([x \in 1..2 |-> x])[2147483647] ELSE (TRUE /\ TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07371 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {1, 2}
---*)
