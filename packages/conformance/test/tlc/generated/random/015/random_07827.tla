(*---
description: Evaluates a random record expression, seed 262, number 7827.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07827 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = [b12089 \in {1} |-> 3]] EXCEPT !.a = @ + CASE (TRUE => FALSE) -> IF FALSE THEN -1 ELSE 7 [] OTHER -> (7 + 2147483647)] EXCEPT !.a = ((CHOOSE b12090 \in ({x \in 1..3 : x > 1} \cap {1}) : (FALSE \/ TRUE)) + ([<<1>> EXCEPT ![1] = 2] \o SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07827 failed.
    2178:0 Overflow when computing 7+2147483647
---*)
