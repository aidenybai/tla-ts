(*---
description: Evaluates a random bool expression, seed 262, number 1417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<>> EXCEPT ![1] = -1] \o Tail(<<3, 1, 2>>)) = (([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 0])) <=> ([a |-> CASE FALSE -> 7 [] OTHER -> 0, b |-> (\A b2259 \in {2, 1, 3} : [a |-> 1, b |-> TRUE])] = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 23 of module random_01417
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01417 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
