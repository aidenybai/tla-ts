(*---
description: Evaluates a random set expression, seed 262, number 1519.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01519 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((-LET b2417 == b2416 IN 1) - IF [b2418 \in {1} |-> 2] THEN (-b2416) ELSE ({1} + [a |-> 1])) : b2416 \in {((CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE))[(-2)], Cardinality({-1 : b2419 \in 2..1})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01519 failed.
    Attempted to apply function:
    <<2, 2>>
    to argument -2, which is not in the domain of the function.
---*)
