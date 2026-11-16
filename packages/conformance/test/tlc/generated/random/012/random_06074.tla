(*---
description: Evaluates a random record expression, seed 262, number 6074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> CASE TRUE -> 1 [] OTHER -> TRUE, b |-> Append(<<1, 2>>, 3)] EXCEPT !.a = @ + ((1 - -1) - CASE TRUE -> 2147483647 [] OTHER -> 3)] EXCEPT !.a = @ + (([b9359 \in {2, 1, 3} |-> b9359])[Cardinality(SUBSET {1})] * (Len(TRUE) % ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06074 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
