(*---
description: Evaluates a random function expression, seed 262, number 3068.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03068 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((1 :> 0) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE)) EXCEPT ![(-IF {} THEN 1 ELSE 0)] = (CASE TRUE -> 1 [] OTHER -> -1 - (7 % -1))] EXCEPT ![(CHOOSE b4866 \in {(-1 + 7), (2147483647 * 3)} : (\E b4867 \in ({1, 2} \ {}) : (SUBSET {1} \subseteq {x \in 1..3 : x > 1})))] = (((2147483647 :> 7))[([a |-> 1]).a] + ([[x \in Nat |-> x + 1] EXCEPT ![FALSE] = 7])[IF FALSE THEN 7 ELSE 2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03068 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as the condition of an IF.
    line 14, col 96 to line 14, col 114 of module random_03068
---*)
