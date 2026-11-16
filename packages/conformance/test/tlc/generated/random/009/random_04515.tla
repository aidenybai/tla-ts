(*---
description: Evaluates a random function expression, seed 262, number 4515.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04515 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7093 \in (([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] \ {2, 1}) \cup {b7094 \in {b7095 \in 2 : FALSE} : (<<3, 1, 2>> = (1 :> 2))}) |-> IF (CASE FALSE -> 1 [] OTHER -> 2 = (CHOOSE b7096 \in {1} : TRUE)) THEN CASE (\A b7097 \in SUBSET {1} : TRUE) -> (b7093 - 3) [] OTHER -> ([a |-> 1] * b7093) ELSE (-([x \in Nat |-> x + 1])[b7093])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b7093 \\in [a |-> -1, b |-> TRUE] \\ {1, 2} \\cup {b7094 \\in {b7095 \\in 2 : <expression line 14, col 110 to line 14, col 114 of module random_04515> } : <expression line 14, col 120 to line 14, col 141 of module random_04515> } |-> <expression line 14, col 150 to line 14, col 344 of module random_04515>]"
---*)
