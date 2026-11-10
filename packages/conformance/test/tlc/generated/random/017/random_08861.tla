(*---
description: Evaluates a random int expression, seed 262, number 8861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b13728 == 7 IN 2147483647 + Head(<<3, 1, 2>>)) % (CHOOSE b13729 \in DOMAIN (1 :> 2) : (FALSE /\ TRUE))) - (((2 - -1) % CASE TRUE -> -1 [] OTHER -> 1) * ((CHOOSE r \in [a : {1, 2}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08861 failed.
    2178:0 Overflow when computing 2147483647+3
---*)
