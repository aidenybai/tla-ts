(*---
description: Evaluates a random set expression, seed 262, number 4143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-({b6526 \in {1, 2} : TRUE})[(<<5, 6>>)[-1]]) .. Cardinality({b6527 \in {b6528 \in <<1>> : TRUE} : (b6527 \in {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04143 failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 19 to line 14, col 61 of module random_04143
---*)
