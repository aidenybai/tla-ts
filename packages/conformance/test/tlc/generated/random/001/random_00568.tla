(*---
description: Evaluates a random set expression, seed 262, number 568.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00568 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b962 \in UNION {{b963 \in {} : FALSE}, {b964 \in {2, 1, 3} : FALSE}} : (CHOOSE r \in [a : {2, 1, 3}] : TRUE)} \cap (([a |-> 1, b |-> FALSE] \cap DOMAIN <<5, 6>>) \cup {(b965 % [a |-> 1]) : b965 \in (1 .. 2147483647)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00568 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1, b |-> FALSE]
---*)
