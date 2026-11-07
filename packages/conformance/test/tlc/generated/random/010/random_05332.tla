(*---
description: Evaluates a random seq expression, seed 262, number 5332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(SelectSeq(Append(<<1>>, {1}), LAMBDA e : e > 0)) EXCEPT ![1] = (IF (<<>> = 1) THEN (2 + 2) ELSE Head(<<>>) * (CHOOSE b8244 \in (0 .. 0) : (\A b8245 \in {1, 2} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    {1}
    2266:0 The first argument of > should be an integer, but instead it is:
    {1}
---*)
