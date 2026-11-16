(*---
description: Evaluates a random seq expression, seed 262, number 9843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(Append([<<>> EXCEPT ![1] = 0], (-1)), Cardinality((1 .. 3))), (((-1 :> 1))[LET b15283 == 3 IN 1] * Head(SelectSeq(<<>>, LAMBDA e : e > 0))), (Len([<<3, 1, 2>> EXCEPT ![1] = 7]) + (-CASE FALSE -> 1 [] OTHER -> 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 38 to line 14, col 41 of module random_09843
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09843 failed.
    Attempted to apply function:
    (-1 :> 1)
    to argument 1, which is not in the domain of the function.
---*)
