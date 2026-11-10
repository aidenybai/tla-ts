(*---
description: Evaluates a random bool expression, seed 262, number 5342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![7] = 2] \subseteq ((Nat \div 2147483647) .. Len(<<>>))) <=> ({CASE TRUE -> b8257 [] OTHER -> 7 : b8257 \in (1..3 \ SUBSET {1})} \subseteq UNION {(2 .. 3), DOMAIN [x \in Nat |-> x + 1]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05342 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
---*)
