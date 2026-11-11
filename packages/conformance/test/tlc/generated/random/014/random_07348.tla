(*---
description: Evaluates a random bool expression, seed 262, number 7348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality({(-1) : b11305 \in (0 .. 1)}), b |-> (\A b11306 \in DOMAIN SelectSeq(<<>>, LAMBDA e : e > 0) : (([a |-> 1, b |-> TRUE] = <<1, 2>>) <=> (FALSE => TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
