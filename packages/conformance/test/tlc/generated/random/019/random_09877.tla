(*---
description: Evaluates a random seq expression, seed 262, number 9877.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09877 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(UNION {{FALSE, 1}, DOMAIN (1 :> 2)} \ UNION {{b15348 \in SUBSET {1} : FALSE}, {b15349 \in Nat : FALSE}}), LET b15350 == ((-1 * 1) + (CHOOSE b15351 \in {2, 1, 3} : TRUE)) IN ((b15350 - 0) \div Head(<<3, 1, 2>>))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09877 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    1
---*)
