(*---
description: Evaluates a random record expression, seed 262, number 2363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b3744 \in {1, 7} |-> Len(<<1, 2>>)] EXCEPT !.a = (Head(<<3, 1, 2>>) * LET b3745 == 7 IN b3745)] EXCEPT !.a = @ + Len(Append(SubSeq(<<>>, <<3, 1, 2>>, 2), (-3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02363 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
