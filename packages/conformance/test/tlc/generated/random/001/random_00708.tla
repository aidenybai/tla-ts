(*---
description: Evaluates a random set expression, seed 262, number 708.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00708 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b1175 \in ((({1} \cap {1, 2}) \cap (SUBSET {1} \ {1, 2})) \cup (({2, 1, 3} \cap [a |-> 1, b |-> TRUE]) \subseteq (1..3 \cap {x \in 1..3 : x > 1}))) : (\A b1176 \in (DOMAIN [x \in 1..2 |-> x] \cup ({x \in 1..3 : x > 1} \ TRUE)) : ({2147483647, 2} = ({1, 2} \cap {1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00708 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
