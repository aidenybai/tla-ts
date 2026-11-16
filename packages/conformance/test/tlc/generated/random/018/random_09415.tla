(*---
description: Evaluates a random bool expression, seed 262, number 9415.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09415 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((Nat \cap {}) .. (1 + [a |-> 1, b |-> TRUE])) = ([<<1>> EXCEPT ![1] = 0] \cup (SUBSET {1} \cap Nat))) => (\E b14604 \in {Cardinality({1}) : b14605 \in DOMAIN <<5, 6>>} : ((2..1 \cup 2..1) \subseteq UNION {2..1, {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09415 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
