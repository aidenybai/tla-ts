(*---
description: Evaluates a random bool expression, seed 262, number 8972.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08972 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13921 \in ({b13922 \in (Nat \ 2..1) : (SUBSET {1} \subseteq Nat)} \cap (([a |-> 1, b |-> TRUE] - 2) .. Head(<<>>))) : (\E b13923 \in DOMAIN ([x \in Nat |-> x + 1] @@ <<5, 6>>) : (~(<<3, 1, 2>> = [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08972 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
