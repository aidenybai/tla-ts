(*---
description: Evaluates a random int expression, seed 262, number 5825.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05825 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((\A b8982 \in ({-1 : b8983 \in TRUE} \cap {b8984 \in {2, 1, 3} : TRUE}) : (~(FALSE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05825 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 51 to line 14, col 54 of module random_05825
---*)
