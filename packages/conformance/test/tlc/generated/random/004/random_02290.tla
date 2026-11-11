(*---
description: Evaluates a random bool expression, seed 262, number 2290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality([[a |-> 1, b |-> TRUE] EXCEPT ![1] = b3613]) : b3613 \in {(b3614 \div b3614) : b3614 \in ({1} \ {1, 2})}} = {b3615 \in ((-1 .. 2147483647) \ (2 .. -1)) : (IF FALSE THEN b3615 ELSE b3615 % (-b3615))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02290 failed.
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
