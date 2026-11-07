(*---
description: Evaluates a random function expression, seed 262, number 4745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) @@ (CASE (<<1, 2>> = [x \in 1..2 |-> x]) -> CASE TRUE -> 0 [] OTHER -> <<1, 2>> [] OTHER -> ([a |-> 1]).a :> ((-2) - CASE FALSE -> 2147483647 [] OTHER -> 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    0
    2169:0 The second argument of @@ should be a function, but instead it is:
    0
---*)
