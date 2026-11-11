(*---
description: Evaluates a random record expression, seed 262, number 7403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([b11404 \in {} |-> 7])[Len([x \in Nat |-> x + 1])], b |-> (\E b11405 \in {7, 0} : (2..1 = {}))] EXCEPT !.a = @ + Cardinality({b11406 \in DOMAIN (1 :> 2) : (~TRUE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07403 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Sequences.Len(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
