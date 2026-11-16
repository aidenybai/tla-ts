(*---
description: Evaluates a random record expression, seed 262, number 5847.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05847 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([(\A b9020 \in {2, 1, 3} : FALSE) EXCEPT !.a = @ + CASE FALSE -> -1 [] OTHER -> 1]).a, b |-> (Cardinality({TRUE : b9021 \in 2..1}) = ((CHOOSE b9022 \in {1} : FALSE) % Head(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05847 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
