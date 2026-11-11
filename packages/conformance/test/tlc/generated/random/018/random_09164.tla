(*---
description: Evaluates a random int expression, seed 262, number 9164.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09164 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((-1 .. 2147483647) = (1..3 \cap {x \in 1..3 : x > 1})) THEN Cardinality(({1} \ {1, 2})) ELSE Cardinality((1 .. -1)) \div (-CASE (FALSE /\ FALSE) -> (CHOOSE b14232 \in SUBSET {1} : FALSE) [] OTHER -> (0 < 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09164 failed.
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
