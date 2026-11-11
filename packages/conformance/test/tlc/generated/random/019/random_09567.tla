(*---
description: Evaluates a random int expression, seed 262, number 9567.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09567 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(SubSeq(<<1>>, 2, 7) % ([a |-> 1] - 2147483647)), Len(SubSeq([a |-> 1], 3, 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09567 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
