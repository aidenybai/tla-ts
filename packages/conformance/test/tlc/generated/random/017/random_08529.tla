(*---
description: Evaluates a random seq expression, seed 262, number 8529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(Tail(Append(<<3, 1, 2>>, 0)), LAMBDA p, q : p < q) EXCEPT ![1] = ((CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE))[(-(2147483647 \div 3))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08529 failed.
    Attempted to apply function:
    (2 :> 1)
    to argument -715827882, which is not in the domain of the function.
---*)
