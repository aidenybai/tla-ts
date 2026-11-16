(*---
description: Evaluates a random bool expression, seed 262, number 9856.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09856 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15300 \in {Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)), IF (-1 \in {}) THEN [b15301 \in 2..1 |-> b15301] ELSE LET b15302 == 0 IN b15302} |-> (CHOOSE b15303 \in UNION {(0 < b15300), {b15300, b15300}} : ({b15304 \in {2, 1, 3} : TRUE} \subseteq {b15300 : b15305 \in 1..3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09856 failed.
    Attempted to compare the set {0} with the value:
    FALSE
---*)
