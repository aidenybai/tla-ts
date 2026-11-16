(*---
description: Evaluates a random seq expression, seed 262, number 7500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq({([[a |-> 1] EXCEPT !.a = 2]).a : b11557 \in ([a |-> 1, b |-> FALSE]).a}, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07500 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    line 14, col 71 to line 14, col 96 of module random_07500
---*)
