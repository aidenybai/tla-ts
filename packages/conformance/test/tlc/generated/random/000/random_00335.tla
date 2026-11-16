(*---
description: Evaluates a random int expression, seed 262, number 335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE))[Head(SelectSeq(Append(<<3, 1, 2>>, 7), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00335 failed.
    Attempted to apply function:
    (0 :> 1 @@ 1 :> 1)
    to argument 3, which is not in the domain of the function.
---*)
