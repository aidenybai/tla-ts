(*---
description: Evaluates a random seq expression, seed 262, number 6243.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06243 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append((\E b9614 \in (CHOOSE r \in [a : 2..1] : TRUE) : (<<1, 2>> = (1 :> 2))), Head((<<1, 2>> \o <<3, 1, 2>>))), ((CHOOSE f \in [2..1 -> {}] : TRUE))[IF (SUBSET {1} = {1}) THEN (7 + 1) ELSE Len(<<3, 1, 2>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06243 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 45 to line 14, col 74 of module random_06243
---*)
