(*---
description: Evaluates a random seq expression, seed 262, number 870.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00870 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([(CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) EXCEPT ![Head(Append(<<1, 2>>, 1))] = ((7 :> -1))[CASE TRUE -> 3 [] OTHER -> 7]], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00870 failed.
    Attempted to apply function:
    (7 :> -1)
    to argument 3, which is not in the domain of the function.
---*)
