(*---
description: Evaluates a random int expression, seed 262, number 3811.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03811 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(SubSeq(<<1>>, 1, 2147483647), LAMBDA p, q : p < q) = [(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a])).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03811 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2147483647
---*)
