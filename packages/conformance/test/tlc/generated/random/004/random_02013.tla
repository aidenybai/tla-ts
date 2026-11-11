(*---
description: Evaluates a random function expression, seed 262, number 2013.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02013 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((DOMAIN (1 :> 2) \cup (2..1 \cup Nat))) :> Cardinality(((CHOOSE r \in [a : {1, 2}] : TRUE) \cap ({} \cup {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02013 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    Nat
    are not both enumerable
---*)
