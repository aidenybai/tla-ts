(*---
description: Evaluates a random bool expression, seed 262, number 6869.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06869 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10535 \in UNION {([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] \ {0 : b10536 \in {1}}), (({1, 2} \cap Nat) \cap {2 : b10537 \in {}})} : (~([a |-> 3, b |-> TRUE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06869 failed.
    Attempted to enumerate S \ T when S:
    [a |-> 7, b |-> TRUE]
    is not enumerable.
---*)
