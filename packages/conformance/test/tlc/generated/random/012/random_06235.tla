(*---
description: Evaluates a random function expression, seed 262, number 6235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9593 \in (((CHOOSE b9594 \in 1..3 : FALSE) \div (7 * 1)) .. Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) |-> CASE ((~FALSE) /\ (3 < b9593)) -> SortSeq((<<3, 1, 2>> \o <<1>>), LAMBDA p, q : p < q) [] OTHER -> (([x \in 1..2 |-> x] @@ <<5, 6>>))[([a |-> 1]).a]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06235 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 58 of module random_06235
---*)
