(*---
description: Evaluates a random set expression, seed 262, number 3922.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03922 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a, ((([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) @@ [<<5, 6>> EXCEPT ![0] = 3]) + ([a |-> 0, b |-> TRUE] % ([x \in Nat |-> x + 1])[3]))})
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
