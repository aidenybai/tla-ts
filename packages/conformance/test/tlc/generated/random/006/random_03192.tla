(*---
description: Evaluates a random seq expression, seed 262, number 3192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SelectSeq((<<>> \o <<3, 1, 2>>), LAMBDA e : e > 0) EXCEPT ![1] = CASE ({1, 2} = Nat) -> (7 - -1) [] OTHER -> (CHOOSE b5075 \in 2..1 : FALSE)], IF ({2, 3} = UNION {SUBSET {1}, {1, 2}}) THEN (CHOOSE b5076 \in (0 .. 1) : (7 = b5076)) ELSE IF (-1 = 0) THEN (-1 % 3) ELSE LET b5077 == 1 IN 3, (((3 :> 0))[([a |-> 1, b |-> TRUE]).a] + (-Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03192 failed.
    Attempted to check equality of the set {1, 2} with the value:
    Nat
---*)
