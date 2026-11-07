(*---
description: Evaluates a random set expression, seed 262, number 3598.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03598 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Cardinality((Nat \cap Nat)) % IF (FALSE => FALSE) THEN (-[a |-> 1, b |-> TRUE]) ELSE ([a |-> 1]).a), ([[[a |-> 1] EXCEPT !.a = [a |-> 1]] EXCEPT !.a = (1 + 3)] - Head([<<1>> EXCEPT ![1] = 2147483647]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Nat
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Nat
    is enumerable
---*)
