(*---
description: Evaluates a random int expression, seed 262, number 9021.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09021 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = Len(<<1>>)]).a % CASE ([<<3, 1, 2>> EXCEPT ![1] = -1] = [b14010 \in {1} |-> b14010]) -> (-(0 * 0)) [] OTHER -> CASE (CHOOSE r \in [a : {}] : TRUE) -> Len(<<1>>) [] OTHER -> (CHOOSE b14011 \in {1, 2} : FALSE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09021 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 192 to line 14, col 219 of module random_09021
---*)
