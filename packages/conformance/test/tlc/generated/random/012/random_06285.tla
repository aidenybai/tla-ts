(*---
description: Evaluates a random seq expression, seed 262, number 6285.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06285 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq([(<<>> \o <<1>>) EXCEPT ![1] = (1 % 3)], ((Nat \ SUBSET {1}) \cup {b9671 \in 2..1 : TRUE}), ([<<5, 6>> EXCEPT ![-1] = 0])[LET b9672 == 7 IN -1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 122 to line 14, col 129 of module random_06285
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06285 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
