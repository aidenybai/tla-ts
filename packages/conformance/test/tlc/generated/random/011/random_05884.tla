(*---
description: Evaluates a random bool expression, seed 262, number 5884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (<<5, 6>> @@ <<5, 6>>), UNION {{1, 2}, {x \in 1..3 : x > 1}}), ([[a |-> 1] EXCEPT !.a = 2]).a) = ((Head(<<>>) :> Len(<<1, 2>>)) @@ [([x \in Nat |-> x + 1] @@ <<5, 6>>) EXCEPT ![(<<5, 6>>)[2147483647]] = ([a |-> 1]).a])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<5, 6>>
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<5, 6>>
---*)
