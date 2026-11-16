(*---
description: Evaluates a random record expression, seed 262, number 926.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00926 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Cardinality(1..3) * LET b1492 == 1 IN b1492) % (-({2, 1, 3} \cup SUBSET {1}))), b |-> ((CHOOSE r \in [a : {1, 2}] : TRUE) = [a |-> [a |-> 0, b |-> FALSE], b |-> (1 = -1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00926 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetCupValue to tlc2.value.impl.IntValue
---*)
