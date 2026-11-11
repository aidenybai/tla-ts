(*---
description: Evaluates a random record expression, seed 262, number 1396.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01396 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((-1 \div 7) + LET b2227 == [x \in Nat |-> x + 1] IN 1) EXCEPT !.a = (Cardinality({1, 2}) - (-1 - 1))] EXCEPT !.a = @ + LET b2228 == ((2147483647 % 7) + IF TRUE THEN -1 ELSE 7) IN ((-b2228) * LET b2229 == -1 IN b2229)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01396 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
