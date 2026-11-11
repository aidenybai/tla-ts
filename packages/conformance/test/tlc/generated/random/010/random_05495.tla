(*---
description: Evaluates a random bool expression, seed 262, number 5495.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05495 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (-3)] = [[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = (1 + 2147483647)]) \/ (DOMAIN (3 :> 7) \subseteq (IF TRUE THEN 0 ELSE 0 .. CASE 7 -> 3 [] OTHER -> 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05495 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
