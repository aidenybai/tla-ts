(*---
description: Evaluates a random seq expression, seed 262, number 9790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<((<<5, 6>>)[<<1, 2>>] % (2 + TRUE)), CASE (TRUE => FALSE) -> (CHOOSE b15195 \in {2, 1, 3} : TRUE) [] OTHER -> ([x \in 1..2 |-> x])[-1]>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09790 failed.
    Attempted to access tuple at a non integral index: <<1, 2>>
---*)
