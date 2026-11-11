(*---
description: Evaluates a random int expression, seed 262, number 5196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(Append(SubSeq(<<1>>, -1, 3), (CHOOSE b8059 \in Nat : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05196 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)
