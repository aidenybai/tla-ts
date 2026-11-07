(*---
description: Evaluates a random function expression, seed 262, number 3618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5712 \in UNION {{(3 % 1), CASE FALSE -> 3 [] OTHER -> 2}, {(-[x \in 1..2 |-> x]), (1 - 2)}} |-> ((-(CHOOSE r \in [a : 2..1] : TRUE)) + (CHOOSE b5713 \in (3 .. -1) : (b5712 = 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
