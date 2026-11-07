(*---
description: Evaluates a random set expression, seed 262, number 3190.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03190 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((-(2 \div 3)) - ((<<3, 1, 2>> \o <<>>) - [a |-> 3, b |-> TRUE])), (CASE ([a |-> 1] = (1 :> 2)) -> (3 % [x \in Nat |-> x + 1]) [] OTHER -> ((1 :> 2))[2] \div (CHOOSE b5074 \in UNION {Nat, {1, 2}} : (b5074 < b5074)))})
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
