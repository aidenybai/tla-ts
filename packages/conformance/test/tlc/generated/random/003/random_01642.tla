(*---
description: Evaluates a random set expression, seed 262, number 1642.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01642 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b2628 \in (2..1 \cup {1}) : (<<1, 2>> = (1 :> 2))) \div ((1 * 0) + (2 * 2))) .. CASE (\E b2629 \in UNION {1..3, {2, 1, 3}} : ([a |-> 1] = [a |-> 1])) -> (Len(<<>>) \div Len(<<1>>)) [] OTHER -> ((<<3, 1, 2>> \div <<3, 1, 2>>) - CASE FALSE -> 3 [] OTHER -> 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01642 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 74 of module random_01642
---*)
