(*---
description: Evaluates a random record expression, seed 262, number 9468.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09468 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Tail((CHOOSE f \in [{1, 2} -> 1..2] : TRUE)) \o <<(-1 * 7), (0 \div 2147483647)>>) EXCEPT !.a = IF ((\E b14716 \in SUBSET {1} : TRUE) => (FALSE => TRUE)) THEN ((7 + 7) % IF FALSE THEN 1 ELSE 0) ELSE (Cardinality(SUBSET {1}) * IF TRUE THEN -1 ELSE 7)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09468 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
