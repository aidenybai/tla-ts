(*---
description: Evaluates a random bool expression, seed 262, number 9821.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09821 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a .. (LET b15246 == SUBSET {1} IN 3 - LET b15247 == 2147483647 IN 0)) = ((-Len(<<1, 2>>)) < Head(SubSeq(<<3, 1, 2>>, 0, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09821 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
