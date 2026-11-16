(*---
description: Evaluates a random set expression, seed 262, number 2872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ([b4549 \in {1, 2} |-> 2] = IF TRUE THEN 3 ELSE 2147483647) -> (CHOOSE b4550 \in (2..1 \cup [x \in Nat |-> x + 1]) : (\E b4551 \in {1, 2} : TRUE)) [] OTHER -> CASE ({1, 2} = Nat) -> (2 - 7) [] OTHER -> IF TRUE THEN 1 ELSE 2147483647, (-((CHOOSE b4552 \in {1} : TRUE) * CASE TRUE -> 7 [] OTHER -> 1))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02872 failed.
    Attempted to check equality of the function <<2, 2>> with the value:
    3
---*)
