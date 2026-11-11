(*---
description: Evaluates a random record expression, seed 262, number 9656.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09656 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-IF (<<>> = <<5, 6>>) THEN (2 * 7) ELSE (-2147483647)), b |-> ([(2147483647 :> 7) EXCEPT ![CASE <<5, 6>> -> 3 [] OTHER -> 7] = Head(<<1, 2>>)] < (CHOOSE b14995 \in ({} \ {1, 2}) : (<<5, 6>> = Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09656 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 120 to line 14, col 127 of module random_09656
---*)
