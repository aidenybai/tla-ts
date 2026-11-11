(*---
description: Evaluates a random function expression, seed 262, number 3630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5736 \in {([[a |-> 1] EXCEPT !.a = @ + b5737]).a : b5737 \in ([[a |-> 1] EXCEPT !.a = @ + -1] \ ({} \ 1..3))} |-> Len(<<(b5736 % b5736), [a |-> -1, b |-> FALSE]>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03630 failed.
    Attempted to enumerate S \ T when S:
    [a |-> 0]
    is not enumerable.
---*)
