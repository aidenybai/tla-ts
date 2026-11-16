(*---
description: Evaluates a random seq expression, seed 262, number 1199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail((SubSeq(<<3, 1, 2>>, 0, 2147483647) \o Tail(<<1>>))) \o SubSeq(SubSeq([<<>> EXCEPT ![1] = 1], Head(<<1, 2>>), Len(<<1, 2>>)), LET b1928 == (-1 * 2) IN (<<5, 6>>)[b1928], LET b1929 == (-1 * 7) IN (b1929 * 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01199 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
