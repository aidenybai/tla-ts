(*---
description: Evaluates a random set expression, seed 262, number 8437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (\A b13056 \in ({x \in 1..3 : x > 1} \cup {}) : ({1, 2} = {})) THEN (CHOOSE b13057 \in ([a |-> 1] \cap 1..3) : (2147483647 < b13057)) ELSE Head([<<3, 1, 2>> EXCEPT ![1] = 1]), (CHOOSE b13058 \in (Len(<<1, 2>>) .. (-2)) : ([<<1, 2>> EXCEPT ![1] = b13058] <=> (FALSE /\ TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08437 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 197 to line 14, col 293 of module random_08437
---*)
