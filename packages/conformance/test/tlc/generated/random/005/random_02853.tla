(*---
description: Evaluates a random int expression, seed 262, number 2853.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02853 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) -> (CHOOSE b4524 \in (2147483647 .. 0) : (2147483647 \in {2, 1, 3})) [] OTHER -> CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> (-7) [] OTHER -> (FALSE * 0) + ((Cardinality(1..3) % (7 - 2)) \div (Cardinality({1}) + Cardinality({1, 2})))))
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
