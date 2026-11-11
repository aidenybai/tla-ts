(*---
description: Evaluates a random record expression, seed 262, number 5879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (7 - 0), b |-> (\A b9066 \in {} : FALSE)] EXCEPT !.a = (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])).a] EXCEPT !.a = @ + Len([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (TRUE - -1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05879 failed.
    Attempted to select field "a" from a non-record value TRUE
    line 14, col 80 to line 14, col 130 of module random_05879
---*)
