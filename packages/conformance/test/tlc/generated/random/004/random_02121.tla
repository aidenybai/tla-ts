(*---
description: Evaluates a random seq expression, seed 262, number 2121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Append((<<1>> \o <<1, 2>>), Cardinality(1..3)), ([<<5, 6>> EXCEPT ![1] = 2147483647])[Tail(FALSE)]) \o [Append([<<3, 1, 2>> EXCEPT ![1] = 7], Cardinality({x \in 1..3 : x > 1})) EXCEPT ![1] = (-Head(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02121 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)
