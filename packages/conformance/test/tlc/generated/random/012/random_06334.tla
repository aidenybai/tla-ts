(*---
description: Evaluates a random function expression, seed 262, number 6334.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06334 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{1, 2} -> 1..2] : TRUE) EXCEPT ![((7 \div 1) * (-2))] = ([TRUE EXCEPT !.a = @ + 0]).a] EXCEPT ![((([a |-> 1, b |-> TRUE]).a % ({x \in 1..3 : x > 1} \div 2147483647)) % ((7 * 7) * (3 * 2)))] = IF ((3 = 3) \/ (3 - 1)) THEN Cardinality(DOMAIN [x \in 1..2 |-> x]) ELSE ([a |-> -1, b |-> TRUE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 54 of module random_06334
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06334 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
