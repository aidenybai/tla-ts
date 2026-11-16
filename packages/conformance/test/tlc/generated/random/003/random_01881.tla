(*---
description: Evaluates a random seq expression, seed 262, number 1881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((Append(<<1>>, 2) :> SortSeq(<<>>, LAMBDA p, q : p < q)))[([<<5, 6>> EXCEPT ![-1] = 2])[Len(<<1>>)]], (CHOOSE b2958 \in ((Nat \cap Nat) \ {2147483647, -1}) : (UNION {b2958, Nat} \subseteq (b2958 .. 0)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 79 to line 14, col 86 of module random_01881
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01881 failed.
    Attempted to check equality of the function <<1, 2>> with the value:
    5
---*)
