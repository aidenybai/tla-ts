(*---
description: Evaluates a random set expression, seed 262, number 4255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b6689 \in {b6690 \in (Nat \ {1}) : (\A b6691 \in -1 : FALSE)} : ((CHOOSE b6692 \in {2, 1, 3} : FALSE) = CASE FALSE -> 1 [] OTHER -> 0)), (-CASE (-1 = 1) -> ((1 :> 2))[2] [] OTHER -> Tail(<<3, 1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04255 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
