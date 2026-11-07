(*---
description: Evaluates a random seq expression, seed 262, number 6528.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06528 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<(CASE FALSE -> 1 [] OTHER -> 2147483647 - LET b10028 == 2..1 IN FALSE), ([b10029 \in [a |-> 1] |-> b10029])[(CHOOSE b10030 \in 2..1 : FALSE)]>> EXCEPT ![1] = ((CHOOSE b10031 \in {b10032 \in {} : TRUE} : (TRUE <=> FALSE)) \div (Head(<<1>>) \div (1 + 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
