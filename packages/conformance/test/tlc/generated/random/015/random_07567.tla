(*---
description: Evaluates a random record expression, seed 262, number 7567.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07567 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality(((-0) .. (TRUE).a)), b |-> (Cardinality((1 .. 1)) = Len(Tail(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07567 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 44 to line 14, col 51 of module random_07567
---*)
