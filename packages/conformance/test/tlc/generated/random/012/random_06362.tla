(*---
description: Evaluates a random record expression, seed 262, number 6362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Len([<<1, 2>> EXCEPT ![1] = 7]) \div (-(<<5, 6>>)[2147483647])), b |-> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + CASE FALSE -> 2147483647 [] OTHER -> 0] = DOMAIN (CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06362 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
