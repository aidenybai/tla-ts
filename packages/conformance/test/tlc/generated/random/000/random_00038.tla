(*---
description: Evaluates a random function expression, seed 262, number 38.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00038 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b56 \in {Len([[a |-> 1] EXCEPT !.a = 0]), (Head(<<1>>) :> (0 \in {x \in 1..3 : x > 1}))} |-> (Head(SubSeq(<<1, 2>>, b56, b56)) - ((7 * 0) + Cardinality(Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00038 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 0]
---*)
