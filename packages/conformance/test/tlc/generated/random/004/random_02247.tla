(*---
description: Evaluates a random function expression, seed 262, number 2247.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02247 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> Len(<<>>) [] OTHER -> (CHOOSE b3532 \in 1..3 : TRUE) :> {b3533 \in {<<1>> : b3534 \in {}} : (7 \in 1..3)}) @@ ((CHOOSE b3535 \in (Nat \ {}) : (0 .. b3535)) :> IF (3 < 1) THEN LET b3536 == 2 IN -1 ELSE (1 - 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02247 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
