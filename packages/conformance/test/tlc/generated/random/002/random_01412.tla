(*---
description: Evaluates a random record expression, seed 262, number 1412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-LET b2245 == 3 IN b2245), b |-> ({b2246 \in SUBSET {1} : TRUE} \subseteq [<<5, 6>> EXCEPT ![-1] = 2])] EXCEPT !.a = @ + (((CHOOSE b2247 \in {1, 2} : TRUE) * ([a |-> 1, b |-> TRUE]).a) * CASE (\E b2248 \in Nat : TRUE) -> (0 * 3) [] OTHER -> (2147483647 * [a |-> 1, b |-> TRUE]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 100 to line 14, col 107 of module random_01412
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01412 failed.
    Attempted to check set membership in a tuple value.
---*)
