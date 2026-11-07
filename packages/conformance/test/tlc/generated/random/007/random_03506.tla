(*---
description: Evaluates a random function expression, seed 262, number 3506.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03506 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5533 \in (({3, 3} \cup (1 .. 3)) \cap (-CASE FALSE -> 1 [] OTHER -> {})) |-> (Head((<<>> \o <<1, 2>>)) % (CHOOSE b5534 \in {b5535 \in <<>> : FALSE} : (\A b5536 \in {2, 1, 3} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
