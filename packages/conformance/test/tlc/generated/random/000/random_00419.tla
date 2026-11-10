(*---
description: Evaluates a random seq expression, seed 262, number 419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0), (CHOOSE b683 \in ({1} \ {1, 2}) : (~FALSE))), (-((CHOOSE b684 \in {1} : FALSE) \div (2147483647 + 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00419 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 95 to line 14, col 135 of module random_00419
---*)
