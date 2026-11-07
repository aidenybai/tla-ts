(*---
description: Evaluates a random seq expression, seed 262, number 4823.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04823 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(((CHOOSE b7524 \in {1, 2} : TRUE) < Len(<<3, 1, 2>>))) EXCEPT ![1] = ([[[x \in 1..2 |-> x] EXCEPT ![1] = 1] EXCEPT ![([x \in 1..2 |-> x])[2147483647]] = (CHOOSE b7525 \in {1, 2} : TRUE)] @@ ([b7526 \in {2, 1, 3} |-> b7526] @@ [b7527 \in 1..3 |-> -1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
---*)
