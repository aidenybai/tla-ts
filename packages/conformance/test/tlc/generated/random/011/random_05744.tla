(*---
description: Evaluates a random seq expression, seed 262, number 5744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SelectSeq((<<1>> \o <<>>), LAMBDA e : e > 0), ((-1 :> 2))[(3 % 1)]) EXCEPT ![1] = Head((Tail(<<3, 1, 2>>) \o SubSeq(<<1>>, 3, 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05744 failed.
    Attempted to apply function:
    (-1 :> 2)
    to argument 0, which is not in the domain of the function.
---*)
