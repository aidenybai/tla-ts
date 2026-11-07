(*---
description: Evaluates a random set expression, seed 262, number 7914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-(CHOOSE b12209 \in UNION {{}, {1}} : (3 < 2))) : b12208 \in {b12210 \in {b12211 \in {b12212 : b12212 \in {1, 2}} : (TRUE \/ TRUE)} : (~(7 = 2147483647))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07914 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 62 of module random_07914
---*)
