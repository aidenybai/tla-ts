(*---
description: Evaluates a random int expression, seed 262, number 2498.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02498 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (3 \div 1), b |-> (FALSE /\ FALSE)] % (LET b3934 == 7 IN 1 % CASE FALSE -> 1 [] OTHER -> 2147483647)) - (((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))[(2 - 7)] + (-(2147483647 \div 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02498 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
