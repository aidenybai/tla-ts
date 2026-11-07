(*---
description: Evaluates a random seq expression, seed 262, number 3473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<Cardinality((0 .. 1)), [(CHOOSE f \in [{} -> {0} \cup {1}] : TRUE) EXCEPT ![Head(<<3, 1, 2>>)] = LET b5490 == 3 IN 2147483647]>> EXCEPT ![1] = ((-(7 - {1})) - IF (1..3 = {1, 2}) THEN (-0) ELSE CASE FALSE -> 2..1 [] OTHER -> 2147483647)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 44 to line 14, col 83 of module random_03473
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
