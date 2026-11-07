(*---
description: Evaluates a random int expression, seed 262, number 8040.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b12411 == ((([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) @@ [[x \in Nat |-> x + 1] EXCEPT ![1] = 0])).a IN CASE (([x \in Nat |-> x + 1])[3] + [<<1, 2>> EXCEPT ![1] = b12411]) -> (([a |-> 1, b |-> TRUE] = SUBSET {1}) % (TRUE => FALSE)) [] OTHER -> LET b12412 == ((1 :> 2))[b12411] IN CASE FALSE -> b12412 [] OTHER -> [a |-> 1, b |-> TRUE])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
