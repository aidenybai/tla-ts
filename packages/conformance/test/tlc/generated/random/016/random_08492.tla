(*---
description: Evaluates a random seq expression, seed 262, number 8492.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08492 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(<<(CHOOSE b13146 \in Nat : TRUE), Len(<<3, 1, 2>>)>>, Head(SubSeq(<<1, 2>>, 3, 1))) EXCEPT ![1] = (CHOOSE b13147 \in UNION {UNION {{1}, {2, 1, 3}}, (1..3 \cap {})} : ({b13148 \in {2, 1, 3} : TRUE} \subseteq (SUBSET {1} \cap {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08492 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 27 to line 14, col 54 of module random_08492
---*)
