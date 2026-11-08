(*---
description: Evaluates a random function expression, seed 262, number 2956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b4683 \in {Head(TRUE) : b4684 \in {b4685 \in SUBSET {1} : TRUE}} |-> Head(<<0, 2147483647>>)] @@ [b4686 \in {([a |-> 1]).a : b4687 \in UNION {1..3, FALSE}} |-> ([[a |-> 1] EXCEPT !.a = <<5, 6>>]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02956 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    TRUE
---*)
