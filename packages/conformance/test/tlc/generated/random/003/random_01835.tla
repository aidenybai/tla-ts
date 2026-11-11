(*---
description: Evaluates a random record expression, seed 262, number 1835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((-2) * (2147483647).a), b |-> ((FALSE => 2147483647) /\ (TRUE /\ TRUE))] EXCEPT !.a = ((-(-0)) - Cardinality({b2907 \in 2..1 : TRUE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01835 failed.
    Attempted to select field "a" from a non-record value 2147483647
    line 14, col 32 to line 14, col 45 of module random_01835
---*)
