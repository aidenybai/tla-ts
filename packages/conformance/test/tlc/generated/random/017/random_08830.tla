(*---
description: Evaluates a random bool expression, seed 262, number 8830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b13674 == Cardinality(1..3) IN (2147483647 * b13674) < (Len(<<1>>) + Len(<<>>))) => (([[a |-> 1] EXCEPT !.a = @ + 2147483647] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]) \/ ((\A b13675 \in {} : TRUE) <=> (\A b13676 \in 1..3 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08830 failed.
    2178:0 Overflow when computing 2147483647*3
---*)
