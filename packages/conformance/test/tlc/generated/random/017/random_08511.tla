(*---
description: Evaluates a random set expression, seed 262, number 8511.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08511 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((2147483647).a < (3 \div {2, 1, 3})) \ ((-Head(<<1, 2>>)) .. (CHOOSE b13186 \in (7 .. 3) : (TRUE \/ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08511 failed.
    Attempted to select field "a" from a non-record value 2147483647
    line 14, col 25 to line 14, col 38 of module random_08511
---*)
