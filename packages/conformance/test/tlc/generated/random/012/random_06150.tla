(*---
description: Evaluates a random bool expression, seed 262, number 6150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality((({} \cup {}) \ DOMAIN <<5, 6>>)), b |-> (UNION {{2 : b9459 \in 1..3}, ({x \in 1..3 : x > 1} \cap SUBSET {1})} = {(b9460 \div b9460) : b9460 \in (Nat \ {x \in 1..3 : x > 1})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06150 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
