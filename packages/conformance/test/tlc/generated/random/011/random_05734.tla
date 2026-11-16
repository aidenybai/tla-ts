(*---
description: Evaluates a random set expression, seed 262, number 5734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b8829 == (-LET b8830 == -1 IN 1) IN ((CHOOSE b8831 \in Nat : FALSE) * Len(<<1>>)), (CHOOSE b8832 \in ((SUBSET {1} \ {2, 1, 3}) \cap (TRUE .. 2147483647)) : ((b8832 .. b8832) = UNION {{}, 2..1}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05734 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 59 to line 14, col 86 of module random_05734
---*)
