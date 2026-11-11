(*---
description: Evaluates a random int expression, seed 262, number 900.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00900 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((Tail(<<2, 0>>) \o SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), CASE TRUE -> 1 [] OTHER -> 7, CASE TRUE -> 7 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00900 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
---*)
