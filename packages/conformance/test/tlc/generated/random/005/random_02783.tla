(*---
description: Evaluates a random int expression, seed 262, number 2783.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02783 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4397 == ((CHOOSE f \in [{0} \cup {1} -> {}] : TRUE))[CASE (\A b4398 \in SUBSET {1} : <<5, 6>>) -> (-7) [] OTHER -> ([x \in Nat |-> x + 1])[3]] IN Len([Append(<<3, 1, 2>>, b4397) EXCEPT ![1] = (3 + 7)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02783 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 31 to line 14, col 70 of module random_02783
---*)
