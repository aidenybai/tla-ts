(*---
description: Evaluates a random int expression, seed 262, number 2051.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-Head(<<1>>)) \div ((2147483647 .. 2147483647) \cap {b3261 \in Nat : FALSE})) % Cardinality((({2, 1, 3} \cup {}) \cap (2147483647 .. 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02051 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
