(*---
description: Evaluates a random function expression, seed 262, number 2504.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02504 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 - 2) - [a |-> 1, b |-> FALSE]) - (CHOOSE b3940 \in {b3941 \in {} : TRUE} : (\A b3942 \in {x \in 1..3 : x > 1} : TRUE))) :> ((LET b3943 == 1 IN b3943 - IF TRUE THEN 3 ELSE 2) - LET b3944 == (7 % 2) IN Cardinality(SUBSET {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
