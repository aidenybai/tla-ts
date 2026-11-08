(*---
description: Evaluates a random set expression, seed 262, number 9734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<1>>) \div (1 * [x \in Nat |-> x + 1])) .. (CHOOSE b15108 \in DOMAIN [x \in Nat |-> x + 1] : (\A b15109 \in {1} : TRUE))) \cup (((2 \div 2) :> (-1 % FALSE)) \ {LET b15111 == b15110 IN b15110 : b15110 \in UNION {{}, [a |-> 1]}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09734 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
