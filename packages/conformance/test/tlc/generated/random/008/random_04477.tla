(*---
description: Evaluates a random bool expression, seed 262, number 4477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([a |-> (-1 - 7), b |-> (TRUE => FALSE)]).a, b |-> (~(\A b7042 \in (2..1 \cap {x \in 1..3 : x > 1}) : (TRUE => <<1>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -8, b |-> FALSE]"
---*)
