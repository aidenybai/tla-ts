(*---
description: Evaluates a random record expression, seed 262, number 7809.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07809 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(((<<>> \o <<1>>) \o <<2, -1>>)), b |-> (((SUBSET {1} \cap 1..3) = {7 : b12050 \in {}}) => (LET b12051 == 0 IN b12051 < ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07809 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
