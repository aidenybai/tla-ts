(*---
description: Evaluates a random bool expression, seed 262, number 8792.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08792 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b13627 \in DOMAIN [<<5, 6>> EXCEPT ![3] = {}] : (~(b13627 \in {2, 1, 3}))) /\ ({SortSeq(<<1>>, LAMBDA p, q : p < q), (<<>> = <<5, 6>>)} = {CASE FALSE -> 7 [] OTHER -> 2147483647, (-0)})))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 40 to line 14, col 47 of module random_08792
    | FALSE
---*)
