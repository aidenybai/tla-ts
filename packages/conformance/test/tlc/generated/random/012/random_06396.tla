(*---
description: Evaluates a random function expression, seed 262, number 6396.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06396 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![CASE (IF <<1>> THEN 0 ELSE 0 < CASE TRUE -> -1 [] OTHER -> -1) -> (-(CHOOSE b9841 \in {x \in 1..3 : x > 1} : TRUE)) [] OTHER -> ([a |-> -1, b |-> TRUE]).a] = LET b9842 == (CHOOSE b9843 \in (1 .. 0) : (<<1>> = (1 :> 2))) IN (LET b9844 == b9842 IN 3 % IF FALSE THEN b9842 ELSE 1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06396 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 82 to line 14, col 136 of module random_06396
---*)
