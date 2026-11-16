(*---
description: Evaluates a random set expression, seed 262, number 6242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(CHOOSE b9609 \in {2 : b9610 \in {}} : (b9609 = b9608)) : b9608 \in {(3 * b9611) : b9611 \in (Nat \cap {})}}, {Head(<<b9612, 2>>) : b9612 \in {Cardinality({}) : b9613 \in (7 :> 2147483647)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06242 failed.
    TLC encountered a non-enumerable quantifier bound
    (7 :> 2147483647).
    line 14, col 196 to line 14, col 210 of module random_06242
---*)
