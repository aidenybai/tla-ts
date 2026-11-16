(*---
description: Evaluates a random seq expression, seed 262, number 78.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SelectSeq([[<<1>> EXCEPT ![1] = 7] EXCEPT ![1] = CASE {1} -> -1 [] OTHER -> 1], LAMBDA e : e > 0), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00078 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 80 to line 14, col 82 of module random_00078
---*)
