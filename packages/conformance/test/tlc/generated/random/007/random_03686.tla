(*---
description: Evaluates a random seq expression, seed 262, number 3686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(Append(<<0, 3>>, (2 * 2)), Head((<<1, 2>> \o <<3, 1, 2>>))), (CHOOSE b5820 \in {b5821 \in ({} \cap 1..3) : ({2, 1, 3} \subseteq {1})} : ((FALSE \/ TRUE) <=> (TRUE \/ FALSE))), Cardinality((({} \ Nat) \ ({1, 2} \ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03686 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 92 to line 14, col 202 of module random_03686
---*)
