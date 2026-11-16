(*---
description: Evaluates a random function expression, seed 262, number 3348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SubSeq(<<3, 1, 2>>, -1, 0)) % (([a |-> 1] @@ [x \in 1..2 |-> x]))[Len(<<>>)]) :> (((7 :> -1))[IF TRUE THEN 2 ELSE 1] * (([a |-> 1]).a \div <<0, 7>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03348 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
