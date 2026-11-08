(*---
description: Evaluates a random bool expression, seed 262, number 3539.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03539 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = 7] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]) /\ (IF FALSE THEN 7 ELSE TRUE \in Head(<<>>))) => (((FALSE <=> TRUE) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1])) => ((1 = 7) => ([a |-> 1, b |-> TRUE] = <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03539 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
