(*---
description: Evaluates a random function expression, seed 262, number 4690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7331 \in {CASE (Nat = 2..1) -> CASE FALSE -> b7332 [] OTHER -> 3 [] OTHER -> ([x \in Nat |-> x + 1])[2] : b7332 \in (CASE FALSE -> 0 [] OTHER -> 0 .. (0 * 7))} : (((<<5, 6>> => TRUE) <=> (2147483647 = 2)) = [(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + (2147483647 + 7)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04690 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
