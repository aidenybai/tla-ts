(*---
description: Evaluates a random int expression, seed 262, number 2683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Cardinality({b4244 \in (Nat \cup Nat) : (\A b4245 \in SUBSET {1} : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    Nat
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    Nat
    are not both enumerable
---*)
