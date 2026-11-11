(*---
description: Evaluates a random seq expression, seed 262, number 2655.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02655 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(SubSeq([<<>> EXCEPT ![1] = 2147483647], (-7), IF TRUE THEN 2147483647 ELSE 1)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 40 of module random_02655
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02655 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    -7
---*)
