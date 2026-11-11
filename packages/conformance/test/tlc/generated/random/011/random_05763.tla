(*---
description: Evaluates a random set expression, seed 262, number 5763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Cardinality({1}) : b8875 \in (3 \in {1, 2})} \ ((CHOOSE b8876 \in 1..3 : TRUE) .. Len(<<1>>))) \cup ({(<<5, 6>>)[b8877] : b8877 \in {7, 1}} \cap DOMAIN [[x \in 1..2 |-> x] EXCEPT ![0] = 3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05763 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 49 to line 14, col 60 of module random_05763
---*)
