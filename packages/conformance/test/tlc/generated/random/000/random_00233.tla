(*---
description: Evaluates a random int expression, seed 262, number 233.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00233 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((FALSE \/ 2147483647) \/ ({1} = {2, 1, 3})) < IF (0 \in {2, 1, 3}) THEN (3 * 1) ELSE (1 % -1)) THEN ([b380 \in {3 : b381 \in 2..1} |-> (b380 \div b380)] @@ ([b382 \in {1} |-> 3] @@ [<<5, 6>> EXCEPT ![7] = [x \in 1..2 |-> x]])) ELSE ((CHOOSE b383 \in ({1, 2} \cap {1, 2}) : ({2, 1, 3} = {1})) \div ((2147483647 :> 2147483647))[(CHOOSE b384 \in {x \in 1..3 : x > 1} : FALSE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00233 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    an integer.
    line 14, col 22 to line 14, col 40 of module random_00233
---*)
