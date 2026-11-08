(*---
description: Evaluates a random record expression, seed 262, number 8134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (Cardinality([x \in Nat |-> x + 1]) * (1 \div 1)), b |-> (\E b12564 \in ({} \cap {1, 2}) : (~TRUE))] EXCEPT !.a = @ + ((CHOOSE b12565 \in {b12566 \in {} : [a |-> 1]} : (TRUE <=> TRUE)) \div CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> (3 * 2) [] OTHER -> (1 % 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08134 failed.
    2181:0 Attempted to compute cardinality of the value
    [x \in Nat |-> <expression line 14, col 52 to line 14, col 56 of module random_08134>]
---*)
