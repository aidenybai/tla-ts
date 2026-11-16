(*---
description: Evaluates a random bool expression, seed 262, number 9654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14990 \in (((SUBSET {1} \ {}) \cup {0, 0}) \cup ({3, <<5, 6>>} \ UNION {{x \in 1..3 : x > 1}, 2..1})) : (\E b14991 \in UNION {(b14990 .. b14990), {3 : b14992 \in {1}}} : (\E b14993 \in (TRUE \cup {2, 1, 3}) : (TRUE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09654 failed.
    Attempted to compare the function <<5, 6>> with the value:
    3
---*)
