(*---
description: Evaluates a random set expression, seed 262, number 5255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((0 % 2) .. IF FALSE THEN 2147483647 ELSE 2147483647) \cap UNION {{{x \in 1..3 : x > 1} : b8133 \in 1..3}, {b8134 \in 1..3 : FALSE}}), {CASE (FALSE => FALSE) -> IF TRUE THEN b8135 ELSE 2147483647 [] OTHER -> Cardinality(1..3) : b8135 \in {b8136 \in {1 : b8137 \in {2, 1, 3}} : (TRUE => TRUE)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05255 failed.
    Size of interval value exceeds the maximum representable size (32bits): 0..2147483647.
---*)
