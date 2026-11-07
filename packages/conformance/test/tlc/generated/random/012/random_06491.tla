(*---
description: Evaluates a random int expression, seed 262, number 6491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head((CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE)) = CASE ((SUBSET {1} \ 2..1) = ((1 :> 2) @@ <<5, 6>>)) -> Head((<<3, 1, 2>> \o <<1>>)) [] OTHER -> CASE ([a |-> 1, b |-> TRUE] = (1 :> 2)) -> (<<5, 6>>)[2147483647] [] OTHER -> LET b9980 == 1 IN -1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    (2 :> 1)
    2283:0 The argument of Head should be a sequence, but instead it is:
    (2 :> 1)
---*)
