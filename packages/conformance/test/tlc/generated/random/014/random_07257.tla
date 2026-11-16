(*---
description: Evaluates a random seq expression, seed 262, number 7257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([Append(SelectSeq(<<>>, LAMBDA e : e > 0), ([x \in 1..2 |-> x])[3]) EXCEPT ![1] = (([a |-> 1, b |-> TRUE]).a - IF FALSE THEN 7 ELSE 3)], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07257 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
