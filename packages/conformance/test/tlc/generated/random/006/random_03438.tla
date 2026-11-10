(*---
description: Evaluates a random seq expression, seed 262, number 3438.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03438 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([b5449 \in {b5450 \in {b5451 : b5451 \in {1, 2}} : ([a |-> 1] <=> FALSE)} |-> Head(Tail(<<1, 2>>))], ([[a |-> 2147483647, b |-> FALSE] EXCEPT !.a = ([a |-> 1]).a]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03438 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 75 to line 14, col 93 of module random_03438
---*)
