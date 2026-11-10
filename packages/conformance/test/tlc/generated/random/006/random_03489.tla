(*---
description: Evaluates a random set expression, seed 262, number 3489.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03489 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {(UNION {{}, 1..3} \cap {0, 2147483647}), ({b5514 \in 1..3 : TRUE} \cap UNION {{1}, Nat})}, ({Len(<<3, 1, 2>>) : b5515 \in (1..3 \cap {})} \cup DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03489 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
---*)
