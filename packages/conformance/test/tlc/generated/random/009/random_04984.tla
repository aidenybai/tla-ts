(*---
description: Evaluates a random set expression, seed 262, number 4984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({[[[a |-> 2, b |-> FALSE] EXCEPT !.a = @ + (CHOOSE b7758 \in {x \in 1..3 : x > 1} : FALSE)] EXCEPT !.a = Cardinality([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0])], ({b7759 \in Tail(<<3, 1, 2>>) : (-1 < 0)} \cup ((CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE)).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04984 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 60 to line 14, col 104 of module random_04984
---*)
