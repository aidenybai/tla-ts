(*---
description: Evaluates a random seq expression, seed 262, number 6840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b10480 \in ((0 .. 1) \cup (\A b10481 \in Nat : TRUE)) : (SelectSeq(<<1>>, LAMBDA e : e > 0) = [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 1])), (((7 + -1) \div (~TRUE)) % (CASE FALSE -> 3 [] OTHER -> {1} \div (0 % 0)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06840 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 67 to line 14, col 69 of module random_06840
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
