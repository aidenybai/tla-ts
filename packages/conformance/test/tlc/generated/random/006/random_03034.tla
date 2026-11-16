(*---
description: Evaluates a random seq expression, seed 262, number 3034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SelectSeq([<<>> EXCEPT ![1] = 3], LAMBDA e : e > 0) EXCEPT ![1] = (-(1 - 7))] \o SelectSeq(SubSeq(Append(<<>>, 2), (0 \div 7), (CHOOSE b4823 \in {1, 2} : TRUE)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 29 to line 14, col 32 of module random_03034
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 68 of module random_03034
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03034 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2>>
    , but instead it is
    0
---*)
