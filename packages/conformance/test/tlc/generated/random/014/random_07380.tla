(*---
description: Evaluates a random bool expression, seed 262, number 7380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11361 \in (DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE) \cap (IF TRUE THEN 7 ELSE 2147483647 .. CASE TRUE -> 1 [] OTHER -> 3)) : (\A b11362 \in {b11363 \in UNION {{x \in 1..3 : x > 1}, {1}} : (~FALSE)} : (\E b11364 \in {b11365 \in {x \in 1..3 : x > 1} : FALSE} : (2 < b11364)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07380 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 40 to line 14, col 84 of module random_07380
---*)
