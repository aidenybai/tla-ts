(*---
description: Evaluates a random int expression, seed 262, number 5731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {((2 - 2147483647) .. IF TRUE THEN 2147483647 ELSE 3), ((3 .. 1) \cap (CHOOSE r \in [a : {}] : TRUE))}, UNION {({3 : b8817 \in {}} \cap UNION {{1, 2}, {1, 2}}), (UNION {2..1, (1 :> 2)} \cap {-1, 2})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05731 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 100 to line 14, col 127 of module random_05731
---*)
