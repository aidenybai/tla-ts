(*---
description: Evaluates a random set expression, seed 262, number 6763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10368 \in ((DOMAIN <<5, 6>> \cap ({x \in 1..3 : x > 1} \cup 2..1)) \cup {b10369 \in UNION {2..1, 1..3} : (2 \in {1})}) : (((b10368 + b10368) .. (b10368 * b10368)) = (({1, 2} \cup {1}) \ UNION {Nat, {1, 2}}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2} with the value:
    Nat
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2} with the value:
    Nat
---*)
