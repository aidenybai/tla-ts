(*---
description: Evaluates a random function expression, seed 262, number 4185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (2..1 \subseteq {1, 2}) THEN (0 - -1) ELSE IF FALSE THEN <<1, 2>> ELSE 0 - CASE (FALSE \/ TRUE) -> [<<5, 6>> EXCEPT ![3] = 7] [] OTHER -> [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]) :> Append([<<2, 3>> EXCEPT ![1] = (2147483647 * 2)], (([a |-> 1, b |-> TRUE] * 3) - CASE FALSE -> 2147483647 [] OTHER -> 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04185 failed.
    2178:0 Overflow when computing 2147483647*2
---*)
