(*---
description: Evaluates a random record expression, seed 262, number 3332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Cardinality(DOMAIN [x \in Nat |-> x + 1]) * ((2147483647 - 2) \div ((1 :> 2))[3])), b |-> ((CASE FALSE -> 2 [] OTHER -> 3 - (CHOOSE b5295 \in {2, 1, 3} : TRUE)) < Len(<<-1, TRUE>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03332 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
