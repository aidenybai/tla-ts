(*---
description: Evaluates a random seq expression, seed 262, number 8950.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08950 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SelectSeq((<<1>> \o <<3, 1, 2>>), LAMBDA e : e > 0)) \o ((SubSeq(<<1>>, -1, 2) \o [<<>> EXCEPT ![1] = 1]) \o Tail(Tail(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08950 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)
