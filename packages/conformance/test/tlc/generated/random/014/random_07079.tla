(*---
description: Evaluates a random set expression, seed 262, number 7079.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07079 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([a |-> Cardinality({}), b |-> (\A b10872 \in {1, 2} : FALSE)]).a, ((CHOOSE f \in [{1} -> 1..2] : TRUE))[(CHOOSE b10873 \in ({1} \cup {x \in 1..3 : x > 1}) : ([a |-> 1, b |-> TRUE] = [a |-> 1]))]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07079 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 123 to line 14, col 209 of module random_07079
---*)
