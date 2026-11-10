(*---
description: Evaluates a random set expression, seed 262, number 3716.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03716 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Tail(<<3, 1, 2>>) \o SubSeq(<<3, 1, 2>>, 0, -1)) \o Append(<<-1, 0>>, Head(<<3, 1, 2>>))) .. ((([x \in 1..2 |-> x])[3] * [[a |-> 1] EXCEPT !.a = @ + 0]) \div Cardinality({2147483647 : b5873 \in {1, 2}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03716 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
