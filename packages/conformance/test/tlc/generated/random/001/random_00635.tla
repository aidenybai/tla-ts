(*---
description: Evaluates a random seq expression, seed 262, number 635.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00635 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(-((-1 \div 0) + (<<5, 6>>)[2147483647])), LET b1060 == (-(-7)) IN CASE (TRUE /\ TRUE) -> ((1 :> 2))[1] [] OTHER -> Head(<<1>>)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00635 failed.
    2179:0 The second argument of \div is 0.
---*)
