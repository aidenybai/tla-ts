(*---
description: Evaluates a random bool expression, seed 262, number 1188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [b1902 \in Nat |-> b1902] \cup {b1903 \in {b1904 \in Nat : TRUE} : (TRUE \/ FALSE)}) = (UNION {({2, 1, 3} \cup {2, 1, 3}), (<<3, 1, 2>> \ {})} \cap ((<<1, 2>> = <<5, 6>>) /\ (1..3 = {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01188 failed.
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    {b1903 \in {b1904 \in Nat : <expression line 14, col 84 to line 14, col 87 of module random_01188> } : <expression line 14, col 93 to line 14, col 105 of module random_01188> }
    are not both enumerable
---*)
