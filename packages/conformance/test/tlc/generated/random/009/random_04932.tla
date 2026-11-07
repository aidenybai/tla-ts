(*---
description: Evaluates a random int expression, seed 262, number 4932.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04932 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(CHOOSE b7670 \in DOMAIN [x \in 1..2 |-> x] : (<<5, 6>> => TRUE))) * Head((<<7, 1>> \o Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04932 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a tuple.
    line 14, col 66 to line 14, col 81 of module random_04932
---*)
