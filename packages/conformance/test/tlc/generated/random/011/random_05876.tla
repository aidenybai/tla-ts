(*---
description: Evaluates a random int expression, seed 262, number 5876.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05876 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({2, 1, 3}) + IF TRUE THEN 7 ELSE 3) * [a |-> (-1 * 0), b |-> (<<>> = [x \in 1..2 |-> x])]) * (LET b9059 == CASE TRUE -> 2147483647 [] OTHER -> 2147483647 IN LET b9060 == 1 IN 7 \div (CHOOSE b9061 \in UNION {2..1, {}} : (\E b9062 \in <<5, 6>> : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
