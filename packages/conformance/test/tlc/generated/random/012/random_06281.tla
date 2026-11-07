(*---
description: Evaluates a random record expression, seed 262, number 6281.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06281 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-(CHOOSE b9666 \in (2 .. 0) : (b9666 = b9666))), b |-> ((Cardinality({1}) \div (-1 - 1)) \in (({} \cap SUBSET {1}) \ ({1, 2} \cup 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06281 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 68 of module random_06281
---*)
