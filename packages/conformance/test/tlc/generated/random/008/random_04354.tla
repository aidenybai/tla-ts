(*---
description: Evaluates a random int expression, seed 262, number 4354.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04354 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b6862 \in (((1 - 3) .. Len(<<1>>)) \cup ((-1 .. 1) \ (1..3 \ SUBSET {1}))) : (~((1..3 \ {1, 2}) \subseteq ({1, 2} \ 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04354 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
