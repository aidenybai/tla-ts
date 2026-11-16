(*---
description: Evaluates a random function expression, seed 262, number 3279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) EXCEPT ![[(CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE) EXCEPT ![IF FALSE THEN 7 ELSE 7] = Cardinality(1..3)]] = ((1 < 2) \/ [[a |-> 1] EXCEPT !.a = 0])] EXCEPT ![(-IF (2147483647 \in {1, 2}) THEN (-1 + 2147483647) ELSE (2 - 0))] = ((CHOOSE r \in [a : {}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03279 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 57 of module random_03279
---*)
