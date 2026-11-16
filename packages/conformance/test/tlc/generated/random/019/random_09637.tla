(*---
description: Evaluates a random function expression, seed 262, number 9637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[b14962 \in SUBSET {1} |-> -1] EXCEPT ![CASE FALSE -> 2 [] OTHER -> 3] = (CHOOSE b14963 \in Nat : FALSE)] @@ ([[x \in Nat |-> x + 1] EXCEPT ![3] = [a |-> 1]] @@ [Nat EXCEPT ![2147483647] = (1 :> 2)])) @@ (LET b14964 == (0 % 0) IN (-b14964) :> ((CHOOSE r \in [a : 1..2] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09637 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)
