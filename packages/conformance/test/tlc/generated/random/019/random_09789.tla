(*---
description: Evaluates a random record expression, seed 262, number 9789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([DOMAIN [b15194 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] |-> (b15194 % 0)] EXCEPT !.a = Len(Append(([a |-> 1, b |-> TRUE] \o <<>>), (-3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09789 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
