(*---
description: Evaluates a random bool expression, seed 262, number 5318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<1>>) % LET b8225 == 7 IN b8225) = Len(SubSeq(<<3, 1, 2>>, 0, 0))) <=> ((Cardinality({1}) = (1 \div 2)) \/ (([a |-> 1] = [a |-> 1]) <=> (TRUE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05318 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
