(*---
description: Evaluates a random set expression, seed 262, number 4353.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04353 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len(<<0, 0>>), (CHOOSE b6859 \in Tail(<<3, 1, 2>>) : ({1, 2} = {}))} \ {(CHOOSE b6860 \in (7 .. 7) : (TRUE <=> FALSE)), (CHOOSE b6861 \in DOMAIN <<5, 6>> : (b6861 \in {}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04353 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 34 to line 14, col 83 of module random_04353
---*)
