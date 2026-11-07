(*---
description: Evaluates a random int expression, seed 262, number 3594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b5666 == Cardinality(((Nat \cap Nat) \cup {2 : b5667 \in 2..1})) IN LET b5668 == (Head(<<1, 2>>) * (<<5, 6>>).a) IN (UNION {2..1, Nat} \cup DOMAIN [x \in 1..2 |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
