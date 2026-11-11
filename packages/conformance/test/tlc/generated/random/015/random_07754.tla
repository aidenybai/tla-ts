(*---
description: Evaluates a random set expression, seed 262, number 7754.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07754 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((([a |-> 1]).a - ([x \in Nat |-> x + 1])[b11959]) % (({2, 1, 3} \cup 1..3) \div ([a |-> 1, b |-> TRUE]).a)) : b11959 \in ((DOMAIN <<5, 6>> \cap (7 \cap {1})) \ ({b11960 \in Nat : TRUE} \cap DOMAIN [x \in 1..2 |-> x]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07754 failed.
    Attempted to check if the value:
    1
    is an element of the integer 7
---*)
