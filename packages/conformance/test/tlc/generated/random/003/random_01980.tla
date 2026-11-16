(*---
description: Evaluates a random seq expression, seed 262, number 1980.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01980 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Len(Tail(<<1, 2>>)) * CASE (\E b3140 \in 2..1 : FALSE) -> (CHOOSE b3141 \in {1, 2} : TRUE) [] OTHER -> (1 * 1)), Cardinality(CASE (2 \in {1, 2}) -> ([a |-> 1, b |-> TRUE] % 2) [] OTHER -> Cardinality(2..1))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01980 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
