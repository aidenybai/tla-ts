(*---
description: Evaluates a random set expression, seed 262, number 5949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Len(<<>>) : b9168 \in ({1} \ SUBSET {1})} \cup (({x \in 1..3 : x > 1} \cap SUBSET {1}) \ DOMAIN <<5, 6>>)) \ UNION {{LET b9170 == -1 IN b9169 : b9169 \in (2..1 \ {1, 2})}, (LET b9171 == 3 IN 2147483647 .. ([x \in Nat |-> x + 1])[7])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05949 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
