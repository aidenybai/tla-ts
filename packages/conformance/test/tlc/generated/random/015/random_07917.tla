(*---
description: Evaluates a random int expression, seed 262, number 7917.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07917 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b12217 == (\E b12218 \in UNION {DOMAIN [x \in 1..2 |-> x], (SUBSET {1} \cup 2..1)} : ((\A b12219 \in {1, 2} : FALSE) <=> (TRUE \/ FALSE))) IN ((CHOOSE b12220 \in (SUBSET {1} \cap {x \in 1..3 : x > 1}) : (0 < <<1, 2>>)) \div (IF TRUE THEN b12217 ELSE b12217 + ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07917 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
