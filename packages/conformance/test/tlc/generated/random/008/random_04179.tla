(*---
description: Evaluates a random int expression, seed 262, number 4179.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04179 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (\E b6570 \in {(TRUE)[b6571] : b6571 \in ({2, 1, 3} \cup Nat)} : (\A b6572 \in ({1} \cap Nat) : (\A b6573 \in 2..1 : FALSE))) -> Len(SubSeq(Tail(<<>>), [[x \in 1..2 |-> x] EXCEPT ![0] = 0], LET b6574 == 3 IN -1)) [] OTHER -> (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04179 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    Nat
    are not both enumerable
---*)
