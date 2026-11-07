(*---
description: Evaluates a random set expression, seed 262, number 2526.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02526 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((IF TRUE THEN 3 ELSE 2..1 * Cardinality({})) + ((3 + -1) \div LET b3984 == 2 IN b3984)), (((<<>> + 7) * IF FALSE THEN 7 ELSE 2) + (-(CHOOSE b3985 \in 2..1 : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
