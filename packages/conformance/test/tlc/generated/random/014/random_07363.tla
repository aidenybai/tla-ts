(*---
description: Evaluates a random int expression, seed 262, number 7363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({x \in 1..3 : x > 1} % 7) \div (1 \div 0)) * (([x \in 1..2 |-> x])[2] * Head(<<1>>))) * (((-0) * [(1 :> 2) EXCEPT ![-1] = {1}]) + IF (\E b11326 \in SUBSET {1} : TRUE) THEN (7 * 2147483647) ELSE CASE FALSE -> 3 [] OTHER -> -1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07363 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
