(*---
description: Evaluates a random set expression, seed 262, number 4320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Cardinality(UNION {Nat, {x \in 1..3 : x > 1}}) - (CHOOSE r \in [a : {}] : TRUE)), (((-1 + 0) + ([a |-> 1] * 3)) \div Len([<<1, 2>> EXCEPT ![1] = 2]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {2, 3} with the value:
    Nat
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {2, 3} with the value:
    Nat
---*)
