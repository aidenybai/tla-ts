(*---
description: Evaluates a random bool expression, seed 262, number 3002.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03002 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\E b4768 \in {x \in 1..3 : x > 1} : TRUE) THEN CASE FALSE -> 2 [] OTHER -> 1 ELSE LET b4769 == 3 IN 7 .. (LET b4770 == 7 IN b4770 - ({1, 2} \cap {1}))) = UNION {{(CHOOSE b4771 \in {1} : 0), ([a |-> 1, b |-> TRUE]).a}, (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 185 to line 14, col 208 of module random_03002
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 185 to line 14, col 208 of module random_03002
---*)
