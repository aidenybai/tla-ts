(*---
description: Evaluates a random int expression, seed 262, number 6678.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06678 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Head(<<>>), b |-> ({1, 2} \subseteq 1..3)]).a - (((CHOOSE b10240 \in {} : TRUE) * CASE FALSE -> 2 [] OTHER -> 1) + Len(SubSeq(<<>>, -1, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06678 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
