(*---
description: Evaluates a random set expression, seed 262, number 8411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \cap {1}) \cup {b13019 \in SUBSET {1} : FALSE}) \cup {(-7), (2147483647 - 2147483647)}) \cup ((({} \cap 2..1) \cup UNION {Nat, {2, 1, 3}}) \cap (CASE TRUE -> -1 [] OTHER -> -1 < IF TRUE THEN 3 ELSE 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
---*)
