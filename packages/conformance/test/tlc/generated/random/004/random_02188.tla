(*---
description: Evaluates a random bool expression, seed 262, number 2188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq((SubSeq(<<1>>, 2, 3) \o Tail(<<3, 1, 2>>)), (-((1 :> 2))[1]), (-(7 - 1))) = (CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02188 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
