(*---
description: Evaluates a random function expression, seed 262, number 9090.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14122 \in {(2147483647 + -1) : b14123 \in (SUBSET {1} \cup TRUE)} : ((b14122 * b14122) < CASE FALSE -> b14122 [] OTHER -> b14122)) :> (Len([<<3, 1, 2>> EXCEPT ![1] = 2]) - (-CASE FALSE -> 0 [] OTHER -> 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09090 failed.
    Attempted to enumerate S \cup T when S:
    {{}, {1}}
    and T:
    TRUE
    are not both enumerable
---*)
