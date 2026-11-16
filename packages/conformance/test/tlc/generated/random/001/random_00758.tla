(*---
description: Evaluates a random int expression, seed 262, number 758.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00758 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> IF FALSE THEN 2 ELSE 2, b |-> (\A b1241 \in 2 : TRUE)] EXCEPT !.a = Cardinality({b1242 : b1242 \in 1..3})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00758 failed.
    TLC encountered a non-enumerable quantifier bound
    2.
    2
---*)
