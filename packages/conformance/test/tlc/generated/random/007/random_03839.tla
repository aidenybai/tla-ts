(*---
description: Evaluates a random set expression, seed 262, number 3839.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03839 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Cardinality((b6050 .. b6050)) - (-(CHOOSE b6051 \in Nat : FALSE))) : b6050 \in ((LET b6052 == -1 IN b6052 - (<<1, 2>> \div 1)) .. Cardinality((SUBSET {1} \cup SUBSET {1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
