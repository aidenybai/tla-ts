(*---
description: Evaluates a random function expression, seed 262, number 2213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((0 :> 7) @@ [b3482 \in 1..3 |-> 2]) @@ (([x \in 1..2 |-> x])[2147483647] :> IF FALSE THEN 7 ELSE 2147483647)) EXCEPT ![IF (\E b3483 \in [b3484 \in {x \in 1..3 : x > 1} |-> 1] : (b3483 \in 1..3)) THEN CASE (1 :> 7) -> ([a |-> 1, b |-> TRUE] + -1) [] OTHER -> ([x \in 1..2 |-> x])[2147483647] ELSE (CASE TRUE -> 1 [] OTHER -> 7 + ((1 :> 2))[2])] = CASE (\E b3485 \in {2 : b3486 \in SUBSET {1}} : (1 < b3485)) -> (([a |-> 1, b |-> TRUE]).a - CASE FALSE -> -1 [] OTHER -> 1) [] OTHER -> (CHOOSE b3487 \in {b3488 \in {x \in 1..3 : x > 1} : TRUE} : (<<1>> = [x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02213 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
