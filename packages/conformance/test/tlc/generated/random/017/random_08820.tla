(*---
description: Evaluates a random seq expression, seed 262, number 8820.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08820 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<({b13656 \in {1 : b13657 \in 1..3} : (TRUE /\ FALSE)})[(CHOOSE b13658 \in {1, 2147483647} : (\A b13659 \in {1} : FALSE))], (((3 % -1) \div Head(<<1>>)) % LET b13660 == (-1 % 0) IN (CHOOSE r \in [a : 1..2] : TRUE))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08820 failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 18 to line 14, col 138 of module random_08820
---*)
