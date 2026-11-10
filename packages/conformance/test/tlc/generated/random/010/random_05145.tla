(*---
description: Evaluates a random bool expression, seed 262, number 5145.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05145 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {(2..1 \cap Nat), {b7990 \in {1} : TRUE}} \ DOMAIN IF TRUE THEN 7 ELSE 0) \subseteq ({b7991 \in ({x \in 1..3 : x > 1} \cup {1}) : (~TRUE)} \cap UNION {UNION {{x \in 1..3 : x > 1}, Nat}, (FALSE \cup {1})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05145 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 68 to line 14, col 95 of module random_05145
---*)
