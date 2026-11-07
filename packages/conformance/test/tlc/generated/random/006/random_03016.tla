(*---
description: Evaluates a random seq expression, seed 262, number 3016.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03016 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {({b4791 \in {1} : TRUE} \cup DOMAIN (1 :> 2)), ({b4792 \in 2147483647 : FALSE} \cup (2147483647 .. 7))} \cup {CASE (FALSE <=> FALSE) -> CASE TRUE -> -1 [] OTHER -> 2 [] OTHER -> (CHOOSE b4793 \in {1} : FALSE), {DOMAIN [x \in Nat |-> x + 1] : b4794 \in (1..3 \cap 1..3)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {Nat} with the value:
    -1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {Nat} with the value:
    -1
---*)
