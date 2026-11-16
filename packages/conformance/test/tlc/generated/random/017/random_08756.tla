(*---
description: Evaluates a random set expression, seed 262, number 8756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((Len(<<>>) :> ([a |-> 1])[b13552]) % ((CHOOSE r \in [a : 1..2] : TRUE) * (b13552 + 2147483647))) : b13552 \in UNION {DOMAIN (CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE), {b13553 \in {2, 3} : (b13553 = b13553)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08756 failed.
    Attempted to access record by a non-string argument: 2
---*)
