(*---
description: Evaluates a random set expression, seed 262, number 9960.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09960 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((-(1 * <<1>>)) .. (CASE FALSE -> 1 [] OTHER -> <<3, 1, 2>> * (3 \div [a |-> 1, b |-> TRUE]))), {((<<5, 6>>)[b15486] * (7 + 2147483647)) : b15486 \in ((3 - -1) .. ((1 :> 2))[2])}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09960 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
