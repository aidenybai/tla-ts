(*---
description: Evaluates a random int expression, seed 262, number 6328.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06328 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq((<<1>> \o <<3, 1, 2>>), Len(<<3, 1, 2>>), (7 * 2))) % (CHOOSE b9725 \in {Head(<<3, 1, 2>>), (2 * 1)} : ((-b9725) \in {1 : b9726 \in {1, 2}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06328 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 3, 1, 2>>
    , but instead it is
    14
---*)
