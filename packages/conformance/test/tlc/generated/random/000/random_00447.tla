(*---
description: Evaluates a random bool expression, seed 262, number 447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<(CHOOSE b729 \in {1} : TRUE), LET b730 == 2 IN -1>>) < (Head(SubSeq(<<>>, 0, -1)) - (-(2 + 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
