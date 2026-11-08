(*---
description: Evaluates a random bool expression, seed 262, number 9931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(((<<1, 2>> \o <<1>>) \o [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]), LET b15451 == (CHOOSE b15452 \in {1} : FALSE) IN LET b15453 == 2 IN b15453) = (Len([<<1>> EXCEPT ![1] = 7]) :> Cardinality((1..3 \ 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09931 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1, b |-> TRUE]
---*)
