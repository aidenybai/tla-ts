(*---
description: Evaluates a random seq expression, seed 262, number 4421.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04421 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq(SubSeq((<<>> \o <<3, 1, 2>>), (0 \div 1), (7 + 1)), LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04421 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
