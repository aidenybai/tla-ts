(*---
description: Evaluates a random function expression, seed 262, number 1042.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01042 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1670 \in {b1671 \in Cardinality(DOMAIN [x \in Nat |-> x + 1]) : ((TRUE <=> 7) <=> (<<1>> = (1 :> 2)))} |-> (CHOOSE b1672 \in {(b1670 * b1670), IF TRUE THEN b1670 ELSE -1} : (([a |-> 1, b |-> TRUE] = [a |-> 1]) \/ (\A b1673 \in Nat : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01042 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
