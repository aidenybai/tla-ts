(*---
description: Evaluates a random seq expression, seed 262, number 1741.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01741 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(([b2766 \in {} |-> b2766] @@ ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])), LAMBDA e : e > 0), ([[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + (-0)]).a, Head(<<((1 :> 2))[2], (2 % 7)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01741 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
