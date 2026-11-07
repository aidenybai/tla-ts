(*---
description: Evaluates a random bool expression, seed 262, number 3927.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03927 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(\A b6189 \in (2147483647 @@ <<5, 6>>) : (FALSE => TRUE))) => ({b6190 \in (2 .. 2) : (FALSE <=> [a |-> 1])} = (Head(<<>>) - Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
---*)
