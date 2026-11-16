(*---
description: Evaluates a random seq expression, seed 262, number 9490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)), Len([[x \in Nat |-> x + 1] EXCEPT ![1] = 3]), (CASE TRUE -> 7 [] OTHER -> 2147483647 - IF FALSE THEN 1 ELSE [a |-> 1, b |-> TRUE])) \o ([SubSeq(<<3, 1, 2>>, -1, -1) EXCEPT ![1] = LET b14743 == -1 IN 2] \o ([<<5, 6>> EXCEPT ![-1] = -1] @@ (<<3, 1, 2>> :> 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09490 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Sequences.Len(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
