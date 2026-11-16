(*---
description: Evaluates a random set expression, seed 262, number 5871.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05871 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \cap 2..1) \cap ({1, 2} \cap SUBSET {1})) \cup ((1 \div 0) .. (-1 - 2147483647))) \cup (UNION {DOMAIN (1 :> 2), (7 .. 2147483647)} \ DOMAIN (-1 :> 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05871 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
