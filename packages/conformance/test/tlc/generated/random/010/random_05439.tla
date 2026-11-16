(*---
description: Evaluates a random function expression, seed 262, number 5439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head({}) % (2147483647 - 0)) % (((1 :> 2) @@ (1 :> 2)))[CASE {} -> 2 [] OTHER -> 2147483647]) :> IF (({x \in 1..3 : x > 1} \cup {2, 1, 3}))[IF TRUE THEN 2147483647 ELSE 0] THEN IF (<<1>> = (1 :> 2)) THEN Len((1 :> 2)) ELSE LET b8421 == 3 IN -1 ELSE Head(SortSeq(<<5, 6>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05439 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
---*)
