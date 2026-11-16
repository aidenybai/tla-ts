(*---
description: Evaluates a random bool expression, seed 262, number 4610.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04610 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SortSeq(Append(<<1>>, 1), LAMBDA p, q : p < q), (CHOOSE b7220 \in (Nat \ 1..3) : (SUBSET {1} = {1, 2}))) = (CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04610 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
