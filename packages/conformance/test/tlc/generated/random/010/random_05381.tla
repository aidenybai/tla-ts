(*---
description: Evaluates a random bool expression, seed 262, number 5381.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05381 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([(<<1>> \o <<>>) EXCEPT ![1] = (1 \div 2)]) < (CHOOSE b8318 \in {CASE TRUE -> -1 [] OTHER -> -1, ([a |-> 1]).a} : (Len([a |-> 1]) = Len(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05381 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
---*)
