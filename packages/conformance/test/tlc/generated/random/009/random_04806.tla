(*---
description: Evaluates a random int expression, seed 262, number 4806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 :> 3))[(<<5, 6>>)[2]] :> (-IF TRUE THEN {2, 1, 3} ELSE -1)))[Head(Tail(SubSeq(<<1, 2>>, 1, 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04806 failed.
    Attempted to apply function:
    (3 :> 3)
    to argument 6, which is not in the domain of the function.
---*)
