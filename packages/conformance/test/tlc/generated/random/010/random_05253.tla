(*---
description: Evaluates a random int expression, seed 262, number 5253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((0 + -1) = (0 \div 1)) -> Cardinality([b8131 \in {} |-> 3]) [] OTHER -> CASE (1..3 = SUBSET {1}) -> (-2147483647) [] OTHER -> (1..3 \subseteq {x \in 1..3 : x > 1}) * ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = @ + CASE TRUE -> 0 [] OTHER -> 2]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
