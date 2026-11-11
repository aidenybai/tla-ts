(*---
description: Evaluates a random record expression, seed 262, number 1282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 7, b |-> TRUE] EXCEPT !.a = @ + ([a |-> 1]).a] EXCEPT !.a = @ + Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))] EXCEPT !.a = @ + ([a |-> (7 * 0), b |-> (\E b2038 \in 1 : FALSE)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01282 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    1
---*)
