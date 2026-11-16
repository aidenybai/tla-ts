(*---
description: Evaluates a random function expression, seed 262, number 4370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([(1 :> 2) EXCEPT ![7] = 2..1] @@ (CHOOSE f \in [{1} -> {1}] : TRUE)) EXCEPT ![((<<5, 6>>)[<<1>>] + (CHOOSE b6886 \in SUBSET {1} : FALSE))] = (LET b6887 == 7 IN 1 % (-1 + 7))] EXCEPT ![IF ([[a |-> 1] EXCEPT !.a = @ + -1] = (CHOOSE r \in [a : {1, 2}] : TRUE)) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a ELSE (CHOOSE b6888 \in DOMAIN <<5, 6>> : (b6888 < 1))] = IF ((FALSE => FALSE) <=> (-1 = 3)) THEN ([a |-> 1, b |-> FALSE] - (1 * 2)) ELSE CASE (~FALSE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> (2147483647 - FALSE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 26 of module random_04370
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04370 failed.
    Attempted to access tuple at a non integral index: <<1>>
---*)
