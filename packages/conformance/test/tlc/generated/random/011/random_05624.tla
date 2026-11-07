(*---
description: Evaluates a random record expression, seed 262, number 5624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((<<5, 6>> @@ (1 :> 2)) @@ ([x \in Nat |-> x + 1] @@ (1 :> 2))))[((0 - 7) \div (-2))], b |-> (((2 % 2) .. (-1 \div 0)) \cup UNION {UNION {Nat, SUBSET {1}}, ({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1})})])
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
