(*---
description: Evaluates a random int expression, seed 262, number 2038.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02038 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b3236 \in DOMAIN (<<1>> :> 0) |-> Cardinality(UNION {{}, {1}})])[(-LET b3237 == (1 - -1) IN CASE FALSE -> -1 [] OTHER -> -1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02038 failed.
    Attempted to compare integer 1 with non-integer:
    <<1>>
---*)
