(*---
description: Evaluates a random function expression, seed 262, number 2644.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02644 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4173 \in {Len(Append(<<3, 1, 2>>, 3)) : b4174 \in UNION {(3 .. 0), DOMAIN [x \in 1..2 |-> x]}} |-> (((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a * IF (FALSE /\ FALSE) THEN (2 - -1) ELSE (-1 - FALSE))])
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
