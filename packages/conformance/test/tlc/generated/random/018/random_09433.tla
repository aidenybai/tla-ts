(*---
description: Evaluates a random set expression, seed 262, number 9433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((({2, 1, 3} \cup 2..1) - Len(<<>>)) \div (CHOOSE b14640 \in {b14639, 7} : (<<>> = <<5, 6>>))) : b14639 \in {Len(<<b14641, 3>>) : b14641 \in DOMAIN [b14642 \in {x \in 1..3 : x > 1} |-> b14642]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
