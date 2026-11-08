(*---
description: Evaluates a random record expression, seed 262, number 2345.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02345 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Len(TRUE), b |-> (SUBSET {1} \subseteq SUBSET {1})] EXCEPT !.a = Len(Append(<<3, 1, 2>>, 2147483647))] EXCEPT !.a = @ + (-(CHOOSE b3719 \in [TRUE EXCEPT !.a = @ + -1] : [[a |-> 1] EXCEPT !.a = @ + b3719]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02345 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
