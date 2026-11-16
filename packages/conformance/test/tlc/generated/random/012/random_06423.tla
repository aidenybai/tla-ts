(*---
description: Evaluates a random bool expression, seed 262, number 6423.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06423 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(2 + 0), CASE TRUE -> 3 [] OTHER -> 7} \cap DOMAIN (2147483647 :> 2)) \subseteq ((-LET b9887 == 0 IN 1) .. ([-1 EXCEPT !.a = <<5, 6>>]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06423 failed.
    Attempted to apply EXCEPT construct to the value -1.
---*)
