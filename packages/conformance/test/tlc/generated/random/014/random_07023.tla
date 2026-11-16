(*---
description: Evaluates a random record expression, seed 262, number 7023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((-2147483647) \div (7 % 2)) - (IF FALSE THEN <<3, 1, 2>> ELSE 7 * {b10771 \in Nat : TRUE})), b |-> ((UNION {[x \in 1..2 |-> x], {2, 1, 3}} \ DOMAIN [x \in Nat |-> x + 1]) \subseteq ({b10772 : b10772 \in {x \in 1..3 : x > 1}} \cup {0 : b10773 \in [a |-> 1]}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07023 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetPredValue to tlc2.value.impl.IntValue
---*)
