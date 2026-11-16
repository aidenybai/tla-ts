(*---
description: Evaluates a random int expression, seed 262, number 6036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<1>>) \div ([a |-> 1, b |-> TRUE]).a) + (Tail(<<3, 1, 2>>) \o (<<1>> = (1 :> 2)))) - Head(SortSeq(Tail(<<1>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06036 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    FALSE
---*)
