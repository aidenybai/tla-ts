(*---
description: Evaluates a random bool expression, seed 262, number 9494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head((<<1>> \o <<1, 2>>)) % ((0 * [a |-> 1]) % (2 * 1))) = CASE ((1 \in {x \in 1..3 : x > 1}) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1])) -> Cardinality(DOMAIN <<5, 6>>) [] OTHER -> ((<<5, 6>>)[1] + (-1 + 0))))
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
