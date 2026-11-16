(*---
description: Evaluates a random function expression, seed 262, number 7683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11831 \in {[b11832 \in {b11833 \in {2, 1, 3} : FALSE} |-> Len(<<1>>)], IF ([a |-> 1] = [a |-> 1]) THEN ([a |-> 1]).a ELSE (-2)} |-> CASE ((3 + 3) = [a |-> b11831, b |-> [a |-> 1]]) -> (CHOOSE b11834 \in {b11835 : b11835 \in 1..3} : (b11834 < 2)) [] OTHER -> (Len(<<3, 1, 2>>) + (7 + b11831))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07683 failed.
    Attempted to compare integer 1 with non-integer:
    <<>>
---*)
