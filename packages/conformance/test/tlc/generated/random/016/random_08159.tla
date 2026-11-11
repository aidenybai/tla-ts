(*---
description: Evaluates a random seq expression, seed 262, number 8159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(((\A b12622 \in DOMAIN <<5, 6>> : (~FALSE)) <=> (\A b12623 \in UNION {2..1, {}} : (~FALSE))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08159 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    TRUE
---*)
