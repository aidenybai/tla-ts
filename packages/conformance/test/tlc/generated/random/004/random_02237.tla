(*---
description: Evaluates a random seq expression, seed 262, number 2237.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02237 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b3517 == (-((1 :> 2))[2]) IN ((CHOOSE b3518 \in SUBSET {1} : [a |-> 1, b |-> TRUE]) % (-1)), Head(SelectSeq(SubSeq(<<>>, <<>>, 0), LAMBDA e : e > 0))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02237 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 53 to line 14, col 103 of module random_02237
---*)
