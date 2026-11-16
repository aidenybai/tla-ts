(*---
description: Evaluates a random record expression, seed 262, number 5516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality({b8527 \in UNION {Nat, Nat} : (b8527 = b8527)}), b |-> [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (-Len(TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05516 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
---*)
