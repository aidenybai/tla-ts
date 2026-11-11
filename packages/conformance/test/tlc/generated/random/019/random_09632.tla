(*---
description: Evaluates a random set expression, seed 262, number 9632.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09632 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-LET b14955 == CASE FALSE -> 0 [] OTHER -> b14954 IN (-b14955)) : b14954 \in (((1 % 7) .. ([x \in Nat |-> x + 1])[7]) \cup ({0, 7} \cup (CHOOSE r \in [a : {}] : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09632 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 155 to line 14, col 182 of module random_09632
---*)
