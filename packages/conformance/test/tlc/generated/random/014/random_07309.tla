(*---
description: Evaluates a random int expression, seed 262, number 7309.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07309 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((IF FALSE THEN 2 ELSE 0 = IF TRUE THEN 1 ELSE 1) <=> (\A b11258 \in (2147483647 .. 1) : (~TRUE))) THEN (CASE (CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE) -> <<1, 0>> [] OTHER -> (1 * 0) \div (-(CHOOSE b11259 \in Nat : FALSE))) ELSE LET b11260 == IF (-1 <=> FALSE) THEN Len(<<1, 2>>) ELSE (-1 + 1) IN ((CHOOSE r \in [a : {}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07309 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 327 to line 14, col 354 of module random_07309
---*)
