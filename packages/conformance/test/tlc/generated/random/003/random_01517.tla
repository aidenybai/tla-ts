(*---
description: Evaluates a random record expression, seed 262, number 1517.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01517 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality({3, 1}), b |-> ((1..3 \cap <<1, 2>>) \subseteq {3, 1})] EXCEPT !.a = @ + Head(Append(Tail(<<>>), (7 \div 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01517 failed.
    Attempted to check set membership in a tuple value.
---*)
