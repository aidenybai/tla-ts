(*---
description: Evaluates a random set expression, seed 262, number 4233.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04233 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([a |-> (TRUE => TRUE), b |-> (7 \in 2..1)]).a : b6655 \in {(Len(<<>>) - ((1 :> 2))[2]), Head(SubSeq(<<1>>, 2, 0))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04233 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
