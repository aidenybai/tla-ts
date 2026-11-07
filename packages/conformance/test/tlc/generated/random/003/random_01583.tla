(*---
description: Evaluates a random seq expression, seed 262, number 1583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append(SubSeq(SubSeq(<<1>>, 3, 0), ([a |-> 1]).a, ([x \in 1..2 |-> x])[-1]), [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + (7 + 3)]), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01583 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
