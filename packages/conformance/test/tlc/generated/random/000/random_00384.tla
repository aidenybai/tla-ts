(*---
description: Evaluates a random int expression, seed 262, number 384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = Len(UNION {Nat, Nat})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Sequences.Len(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Sequences.Len(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
---*)
