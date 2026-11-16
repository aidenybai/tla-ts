(*---
description: Evaluates a random int expression, seed 262, number 3490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE) EXCEPT ![(LET b5516 == (7 * 3) IN ([x \in 1..2 |-> x])[3] % (-(-1 \div 0)))] = IF ((TRUE <=> TRUE) /\ (3 < 7)) THEN (CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE) ELSE ((2147483647 + -1) % (2147483647 \div 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03490 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
