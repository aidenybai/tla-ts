(*---
description: Evaluates a random function expression, seed 262, number 4629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7246 \in ({LET b7248 == 7 IN b7247 : b7247 \in {0, 3}} \cap {LET b7250 == b7249 IN 3 : b7249 \in DOMAIN <<5, 6>>}) |-> (CHOOSE b7251 \in {b7252 \in (SUBSET {1} \ {1}) : (7 < b7246)} : ((\A b7253 \in {1, 2} : TRUE) <=> (~FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04629 failed.
    Attempted to compare the set {} with the value:
    1
---*)
