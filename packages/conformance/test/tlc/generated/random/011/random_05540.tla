(*---
description: Evaluates a random set expression, seed 262, number 5540.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05540 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b8568 == ([a |-> 1, b |-> TRUE]).a IN (CHOOSE b8569 \in {1, 2} : TRUE) + (CHOOSE b8570 \in UNION {[a |-> 1], 2..1} : (<<1, 2>> = <<5, 6>>))) .. (Head(<<2147483647, 1>>) \div (Head(<<>>) % (-0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05540 failed.
    Attempted to compare the set {} with the value:
    [a |-> 1]
---*)
