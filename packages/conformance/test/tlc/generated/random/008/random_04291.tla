(*---
description: Evaluates a random bool expression, seed 262, number 4291.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04291 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE f \in [{} -> {2, 1, 3}] : TRUE))[CASE FALSE -> 0 [] OTHER -> b6756] : b6756 \in DOMAIN [a |-> [a |-> 1, b |-> TRUE], b |-> FALSE]} = (UNION {(1..3 \cup 1..3), {b6757 : b6757 \in {1}}} \cap ((1 .. 3) \cup (TRUE <=> TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04291 failed.
    Attempted to apply function:
    <<>>
    to argument "a", which is not in the domain of the function.
---*)
