(*---
description: Evaluates a random function expression, seed 262, number 8019.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12370 \in {(Head(<<1>>) - Len(0)), CASE ({} = {2, 1, 3}) -> (7 % 2) [] OTHER -> Cardinality({})} |-> (Len([TRUE EXCEPT ![1] = 2147483647]) \div Len(Tail(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08019 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    0
---*)
