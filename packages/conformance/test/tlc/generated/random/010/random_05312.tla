(*---
description: Evaluates a random set expression, seed 262, number 5312.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05312 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8219 \in {((CHOOSE b8220 \in {x \in 1..3 : x > 1} : FALSE) - ({1, 2} = {1, 2})), Len(SubSeq(FALSE, 3, 1))} : (Len(({x \in 1..3 : x > 1} \ {})) = CASE (~TRUE) -> Append(<<3, 1, 2>>, b8219) [] OTHER -> (b8219 + b8219))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05312 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 74 of module random_05312
---*)
