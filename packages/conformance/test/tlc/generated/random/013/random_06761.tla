(*---
description: Evaluates a random set expression, seed 262, number 6761.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06761 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((CHOOSE b10364 \in SUBSET {1} : TRUE) < LET b10365 == b10363 IN 2) -> ((<<>> \o <<>>) + Cardinality({2, 1, 3})) [] OTHER -> CASE (FALSE /\ TRUE) -> (b10363 + b10363) [] OTHER -> (-b10363) : b10363 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06761 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    {}
---*)
