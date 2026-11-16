(*---
description: Evaluates a random set expression, seed 262, number 9025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CASE (3 \in {1}) -> ([a |-> 1]).a [] OTHER -> (b14017 % 0) % ((CHOOSE b14018 \in {} : FALSE) \div Cardinality({}))) : b14017 \in ({Cardinality({x \in 1..3 : x > 1}), ([a |-> 1]).a} \cap ((3 \cup 1..3) \ (FALSE <=> FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09025 failed.
    Attempted to check if the value:
    2
    is an element of the boolean TRUE
---*)
