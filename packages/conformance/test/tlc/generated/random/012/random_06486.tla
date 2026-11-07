(*---
description: Evaluates a random seq expression, seed 262, number 6486.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06486 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(IF (1..3 \subseteq {}) THEN (7 * 7) ELSE ([x \in Nat |-> x + 1] \div 0) % CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> (TRUE \subseteq {x \in 1..3 : x > 1}) [] OTHER -> (0 + 2)), Len(SubSeq(SelectSeq(<<>>, LAMBDA e : e > 0), (2147483647 * 7), (-1 - {x \in 1..3 : x > 1})))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
