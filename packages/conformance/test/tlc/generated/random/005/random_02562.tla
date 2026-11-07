(*---
description: Evaluates a random bool expression, seed 262, number 2562.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02562 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b4037 \in (CASE FALSE -> 2 [] OTHER -> -1 .. (FALSE + 2147483647)) : ((2..1 \ Nat) \subseteq (2..1 \cap {}))) => ((\E b4038 \in {2 : b4039 \in {2, 1, 3}} : ([a |-> 1] = {x \in 1..3 : x > 1})) <=> ([<<1, 2>> EXCEPT ![1] = 3] = {b4040 \in {x \in 1..3 : x > 1} : (1 :> 2)}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
