(*---
description: Evaluates a random bool expression, seed 262, number 473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b783 \in UNION {UNION {<<>>, Nat}, UNION {{}, Nat}} : ((1 % b783) < (TRUE <=> TRUE))} = {(CHOOSE b784 \in {7 : b785 \in {2, 1, 3}} : (FALSE /\ FALSE)), Len(SelectSeq(<<>>, LAMBDA e : e > 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00473 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 108 to line 14, col 166 of module random_00473
---*)
