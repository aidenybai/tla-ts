(*---
description: Evaluates a random record expression, seed 262, number 3523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b5566 \in DOMAIN [<<5, 6>> EXCEPT ![[x \in Nat |-> x + 1]] = 2147483647] : (Cardinality({1}) < (2147483647 \div 1))), b |-> (CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> Cardinality({1}) [] OTHER -> (1 + 7) \in {b5567 \in (2..1 \cup {2, 1, 3}) : ({1, 2} = {2, 1, 3})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03523 failed.
    Attempted to access tuple at a non integral index: [x \in Nat |-> <expression line 14, col 82 to line 14, col 86 of module random_03523>]
---*)
