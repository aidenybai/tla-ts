(*---
description: Evaluates a random set expression, seed 262, number 4494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (CASE ((1 :> 2) => FALSE) -> (CHOOSE b7063 \in 2..1 : TRUE) [] OTHER -> Len(<<1>>) :> Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04494 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 30 to line 14, col 46 of module random_04494
---*)
