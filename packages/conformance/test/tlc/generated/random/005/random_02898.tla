(*---
description: Evaluates a random set expression, seed 262, number 2898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({2, 2} \cup {b4587 \in 1..3 : FALSE}) \cap (({1} \ SUBSET {1}) \cup UNION {1..3, 2..1})) \cap DOMAIN ((CHOOSE b4588 \in {1} : TRUE) :> (-7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02898 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
