(*---
description: Evaluates a random record expression, seed 262, number 9492.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09492 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b14746 \in {b14747 \in DOMAIN ([x \in Nat |-> x + 1] @@ (1 :> 2)) : (({2, 1, 3} \subseteq {1}) \/ (\A b14748 \in {1} : FALSE))} : ((UNION {1..3, {1}} \ DOMAIN <<5, 6>>) \subseteq {Head(<<1>>) : b14749 \in ({2, 1, 3} \cup {2, 1, 3})})))
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
