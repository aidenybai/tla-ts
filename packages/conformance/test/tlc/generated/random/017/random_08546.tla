(*---
description: Evaluates a random set expression, seed 262, number 8546.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08546 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((([a |-> 1, b |-> TRUE]).a % (CHOOSE b13246 \in {1, 2} : TRUE)) * (-CASE 2 -> b13245 [] OTHER -> b13245)) : b13245 \in (((Nat \cup {}) \cup UNION {{}, 2..1}) \ ((-0) .. Len(<<3, 1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08546 failed.
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    {}
    are not both enumerable
---*)
