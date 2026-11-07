(*---
description: Evaluates a random bool expression, seed 262, number 4287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<3, 1, 2>> EXCEPT ![1] = -1] = ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])) => ((\E b6749 \in 2..1 : FALSE) /\ (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE))) /\ ((-Head(<<1, 2>>)) < Cardinality(UNION {SUBSET {1}, Nat}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
