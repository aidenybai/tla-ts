(*---
description: Evaluates a random seq expression, seed 262, number 2723.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02723 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq({LET b4299 == Len(<<>>) IN (0 * b4299), Head([<<3, 1, 2>> EXCEPT ![1] = 0])}, ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a, Len(SubSeq(<<3, 3>>, (7 % 2), LET b4300 == 7 IN b4300))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 3>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 3>>
    , but instead it is
    7
---*)
