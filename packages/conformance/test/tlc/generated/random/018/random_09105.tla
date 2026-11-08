(*---
description: Evaluates a random seq expression, seed 262, number 9105.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09105 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq((DOMAIN (1 :> 2) \ ({x \in 1..3 : x > 1} \cap 2..1)), ((3 + 7) % (1 \div 0)), (CHOOSE b14146 \in (2..1 \cup {2, 1, 3}) : ({} \subseteq {}))), LET b14147 == (CHOOSE b14148 \in (Nat \cup {2, 1, 3}) : (FALSE => [a |-> 1, b |-> TRUE])) IN CASE (TRUE /\ FALSE) -> LET b14149 == b14147 IN b14149 [] OTHER -> LET b14150 == b14147 IN 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09105 failed.
    2179:0 The second argument of \div is 0.
---*)
