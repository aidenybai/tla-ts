(*---
description: Evaluates a random set expression, seed 262, number 2739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({[b4325 \in (Len(<<1, 2>>) .. Head(<<>>)) |-> ((CHOOSE b4326 \in {1, 2} : FALSE) \div (b4325 + 3))], Cardinality(DOMAIN [(1 :> 2) EXCEPT ![-1] = 2])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02739 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
