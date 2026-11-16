(*---
description: Evaluates a random seq expression, seed 262, number 1008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail([<<3, -1>> EXCEPT ![1] = (CHOOSE b1620 \in 2..1 : TRUE)]) \o Append((SelectSeq(<<>>, LAMBDA e : e > 0) \o ({1} = {})), Head(Append(<<1, 2>>, <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01008 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 48 to line 14, col 75 of module random_01008
---*)
