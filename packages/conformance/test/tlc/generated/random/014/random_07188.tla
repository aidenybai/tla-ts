(*---
description: Evaluates a random record expression, seed 262, number 7188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((([x \in 1..2 |-> x] % 7) :> (0 * 7)))[((3 % 2) + (-1 % 2))], b |-> (((<<5, 6>>)[2147483647] .. LET b11042 == 1 IN 1) \subseteq (Len(<<1, 2>>) .. ([x \in Nat |-> x + 1])[2147483647]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07188 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
