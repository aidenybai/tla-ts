(*---
description: Evaluates a random set expression, seed 262, number 6140.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06140 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{<<1>>, 2147483647}, {b9437 \in SUBSET {1} : FALSE}} \cup ((SUBSET {1} \cap {}) \cap {b9438 : b9438 \in 2147483647})) \ [[a |-> (2147483647 + -1), b |-> (FALSE \/ FALSE)] EXCEPT !.a = Cardinality({b9439 \in {1} : TRUE})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06140 failed.
    TLC encountered a non-enumerable quantifier bound
    2147483647.
    2147483647
---*)
