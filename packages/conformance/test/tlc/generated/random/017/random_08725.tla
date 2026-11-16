(*---
description: Evaluates a random record expression, seed 262, number 8725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF TRUE THEN 2 ELSE 1 * Cardinality(SUBSET {1})), b |-> ((0)[7] .. (7 % 1))] EXCEPT !.a = @ + (-Cardinality({[a |-> 1, b |-> TRUE] : b13513 \in 1..3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08725 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 82 to line 14, col 87 of module random_08725
---*)
