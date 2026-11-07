(*---
description: Evaluates a random function expression, seed 262, number 374.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00374 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b615 \in DOMAIN ([[x \in Nat |-> x + 1] EXCEPT ![7] = 0] @@ [[x \in Nat |-> x + 1] EXCEPT ![1] = 3]) |-> (CHOOSE b616 \in ({0, b615} \cup (1..3 \cap {2, 1, 3})) : ((1..3 \subseteq 3) = ({1} \cup Nat)))])
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
