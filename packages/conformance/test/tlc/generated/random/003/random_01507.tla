(*---
description: Evaluates a random function expression, seed 262, number 1507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b2401 \in ({b2402 \in 2..1 : b2402} \cup DOMAIN (1 :> 2)) |-> ([b2403 \in 2..1 |-> -1])[(1 - b2401)]] EXCEPT ![(Head(SubSeq(<<5, 6>>, 0, 2147483647)) \div Head(Append(<<1, 2>>, 2)))] = Len(SelectSeq(SubSeq(<<>>, 2147483647, -1), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01507 failed.
    In applying the function
    <<>>,
    the first argument is:
    0
    which is not in its domain.
---*)
