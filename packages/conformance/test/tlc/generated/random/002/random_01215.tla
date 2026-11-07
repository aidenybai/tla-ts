(*---
description: Evaluates a random function expression, seed 262, number 1215.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01215 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([b1950 \in 2..1 |-> -1] @@ (CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE)) EXCEPT ![((1 \div 2147483647) \div CASE FALSE -> 2 [] OTHER -> 2147483647)] = LET b1951 == (-2147483647) IN IF FALSE THEN 2147483647 ELSE b1951] EXCEPT ![(([a |-> 0, b |-> FALSE]).a - ((2147483647 \div {}) + (1 - 3)))] = LET b1952 == (Head(<<>>) \div Head(<<1, 2>>)) IN CASE ({x \in 1..3 : x > 1} \subseteq {1, 2}) -> Head(<<1, 2>>) [] OTHER -> ([a |-> 1]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 91 of module random_01215
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
