(*---
description: Evaluates a random seq expression, seed 262, number 316.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00316 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(([[<<3, 1, 2>> EXCEPT ![1] = 2147483647] EXCEPT ![1] = Append(<<>>, -1)] \o SelectSeq([<<>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0)), ([a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (~FALSE)]).a, (CHOOSE b525 \in {CASE SUBSET {1} -> b526 [] OTHER -> b526 : b526 \in ({1} \cap {1})} : (\A b527 \in (2147483647 .. 0) : ({} \subseteq Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 110 to line 14, col 113 of module random_00316
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00316 failed.
    A non-boolean expression (a set of the form SUBSET S) was used as a condition of a CASE. line 14, col 240 to line 14, col 249 of module random_00316
---*)
