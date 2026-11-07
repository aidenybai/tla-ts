(*---
description: Evaluates a random bool expression, seed 262, number 452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-((b745 % b745) \div (1 \div b745))) : b745 \in (SelectSeq((<<1>> \o <<1>>), LAMBDA e : e > 0) .. (Cardinality(1..3) + (CHOOSE b746 \in {x \in 1..3 : x > 1} : FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00452 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 138 to line 14, col 181 of module random_00452
---*)
