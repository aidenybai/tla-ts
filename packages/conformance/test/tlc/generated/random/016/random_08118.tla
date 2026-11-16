(*---
description: Evaluates a random int expression, seed 262, number 8118.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08118 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (({2 : b12544 \in {1}} \cap ({} \cup {1})) \subseteq {b12545 \in {0, (1 :> 2)} : (-1 \in {1})}) -> ((CHOOSE b12546 \in (1..3 \cup SUBSET {1}) : (~FALSE)) \div ([[a |-> 1] EXCEPT !.a = 3]).a) [] OTHER -> (-(CHOOSE b12547 \in {b12548 : b12548 \in {}} : (2 = b12547))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08118 failed.
    Attempted to compare the function <<2>> with the value:
    0
---*)
