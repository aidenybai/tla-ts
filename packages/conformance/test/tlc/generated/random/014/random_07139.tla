(*---
description: Evaluates a random seq expression, seed 262, number 7139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([<<Head([a |-> 1]), CASE FALSE -> 0 [] OTHER -> 3>> EXCEPT ![1] = (CHOOSE b10965 \in SelectSeq(<<1, 2>>, LAMBDA e : e > 0) : (b10965 \in {1, 2}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1]
---*)
