(*---
description: Evaluates a random seq expression, seed 262, number 269.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00269 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(((<<3, 1, 2>> \o <<>>) \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), (CHOOSE r \in [a : {1, 2}] : TRUE), ((2147483647 - 0) - LET b454 == 0 IN 3)), LET b455 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a IN (-(b455 % -1)), ((CHOOSE r \in [a : {1, 2}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00269 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
