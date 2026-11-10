(*---
description: Evaluates a random seq expression, seed 262, number 9596.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09596 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SubSeq((<<1, 2>> \o <<3, 1, 2>>), CASE (1 :> 2) -> 2 [] OTHER -> 1, (-1 - {1, 2})), LAMBDA e : e > 0) EXCEPT ![1] = (CHOOSE b14900 \in DOMAIN (CHOOSE f \in [{} -> 2..1] : TRUE) : ({b14901 \in 1..3 : TRUE} \subseteq DOMAIN [x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09596 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as a condition of a CASE. line 14, col 67 to line 14, col 72 of module random_09596
---*)
