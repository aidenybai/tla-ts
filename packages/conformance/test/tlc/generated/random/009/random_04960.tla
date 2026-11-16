(*---
description: Evaluates a random seq expression, seed 262, number 4960.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04960 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<(CHOOSE b7719 \in {0, 1} : (FALSE \/ TRUE)), Len(SelectSeq(<<1>>, LAMBDA e : e > 0))>>, LET b7720 == (-CASE FALSE -> 0 [] OTHER -> 2) IN LET b7721 == (b7720 - [x \in Nat |-> x + 1]) IN (CHOOSE b7722 \in Nat : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04960 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 211 to line 14, col 237 of module random_04960
---*)
