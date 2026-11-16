(*---
description: Evaluates a random int expression, seed 262, number 5678.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05678 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SubSeq(SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (-2147483647), (3 \div 7)), ((3 :> 0))[(<<1>>).a], ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05678 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    -2147483647
---*)
