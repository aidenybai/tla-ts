(*---
description: Evaluates a random function expression, seed 262, number 532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b895 \in {b896 : b896 \in TRUE} |-> (-b895)] \cup {b897 \in ((<<5, 6>> @@ [x \in 1..2 |-> x]) \cap (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE)) : ((<<1, 2>> \ {2, 1, 3}) = (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00532 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 51 to line 14, col 54 of module random_00532
---*)
