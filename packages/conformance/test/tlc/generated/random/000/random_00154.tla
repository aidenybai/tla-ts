(*---
description: Evaluates a random int expression, seed 262, number 154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(UNION {2..1, Nat}) = ([[a |-> 1] EXCEPT !.a = @ + 2] * (2147483647 % 3)))).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00154 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
