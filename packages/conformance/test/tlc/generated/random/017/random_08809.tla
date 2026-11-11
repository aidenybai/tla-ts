(*---
description: Evaluates a random set expression, seed 262, number 8809.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08809 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b13647 \in {2, 3} : (FALSE /\ FALSE)} \cap ({b13648 : b13648 \in 1..3} \ DOMAIN [x \in Nat |-> x + 1])) \cup (((2 \div [x \in Nat |-> x + 1]) \div (-2)) .. (CASE [a |-> 1] -> 1 [] OTHER -> 3 % Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08809 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
