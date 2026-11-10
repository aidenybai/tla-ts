(*---
description: Evaluates a random bool expression, seed 262, number 2183.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02183 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((b3443 * 1) * (2 % b3443)) : b3443 \in ((1 .. -1) \cup {b3444 \in 1..3 : FALSE})} \subseteq (((<<5, 6>>)[0] % (3 * 2147483647)) .. {b3445 \in (7 \cup Nat) : ({2, 1, 3} = {1, 2})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02183 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
