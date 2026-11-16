(*---
description: Evaluates a random set expression, seed 262, number 1973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a + IF (FALSE \/ FALSE) THEN (-b3124) ELSE ([x \in 1..2 |-> x])[2147483647]) : b3124 \in DOMAIN (Cardinality({x \in 1..3 : x > 1}) :> IF 1 THEN 0 ELSE 7)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01973 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 197 to line 14, col 214 of module random_01973
---*)
