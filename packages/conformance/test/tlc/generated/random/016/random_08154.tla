(*---
description: Evaluates a random set expression, seed 262, number 8154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Cardinality({x \in 1..3 : x > 1}), (3 - 7)} \cup {b12612 \in UNION {Nat, {1, 2}} : (FALSE => TRUE)}) \cup DOMAIN [b12613 \in {b12614 \in {x \in 1..3 : x > 1} : TRUE} |-> (1 \div b12613)]))
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
