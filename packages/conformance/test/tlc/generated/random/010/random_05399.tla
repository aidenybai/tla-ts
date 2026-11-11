(*---
description: Evaluates a random function expression, seed 262, number 5399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([b8353 \in ({2, 1, 3} \ 2..1) |-> Len(<<1, 2>>)] @@ [b8354 \in UNION {1..3, 1..3} |-> IF FALSE THEN -1 ELSE b8354]) EXCEPT ![(CHOOSE b8355 \in {(b8356 - 1) : b8356 \in DOMAIN [x \in Nat |-> x + 1]} : ((<<1, 2>> = <<5, 6>>) /\ (TRUE <=> TRUE)))] = [b8357 \in UNION {(3 .. 2147483647), ({} \cup 2..1)} |-> ([b8358 \in {2, 1, 3} |-> 0])[(b8357 + b8357)]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05399 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 186 to line 14, col 213 of module random_05399
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
