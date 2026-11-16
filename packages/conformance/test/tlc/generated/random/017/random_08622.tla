(*---
description: Evaluates a random bool expression, seed 262, number 8622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + Len(<<1>>)] EXCEPT !.a = ((FALSE \div 3) \div (-1 \div 0))] = [a |-> (Cardinality(2..1) + (<<5, 6>>)[3]), b |-> ((0 .. 3) = {b13355 : b13355 \in TRUE})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08622 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
