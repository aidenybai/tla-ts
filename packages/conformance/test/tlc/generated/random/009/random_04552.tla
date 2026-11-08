(*---
description: Evaluates a random bool expression, seed 262, number 4552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE f \in [2..1 -> {1, 2}] : TRUE) EXCEPT ![(-0)] = [[a |-> 1] EXCEPT !.a = 2]] < ((-7) * (CHOOSE b7137 \in SUBSET {1} : <<1>>))) => (UNION {(SUBSET {1} \cup {2, 1, 3}), (-1 .. 7)} <=> ({2, 2} \subseteq ({1, 2} \cap {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 55 of module random_04552
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04552 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 114 to line 14, col 148 of module random_04552
---*)
