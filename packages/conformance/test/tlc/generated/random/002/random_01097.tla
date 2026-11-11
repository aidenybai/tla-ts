(*---
description: Evaluates a random function expression, seed 262, number 1097.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01097 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[b1747 \in (Nat \cap Nat) |-> Cardinality(2..1)] EXCEPT ![CASE (<<1>> = (1 :> 2)) -> LET b1748 == 2147483647 IN b1748 [] OTHER -> IF TRUE THEN -1 ELSE 2] = (DOMAIN [x \in Nat |-> x + 1] - (--1))] EXCEPT ![IF (\E b1749 \in UNION {Nat, {2, 1, 3}} : (FALSE => FALSE)) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a ELSE ((2..1 + 2147483647) % (2 % 2))] = ([b1750 \in ({} \ 1..3) |-> [a |-> -1, b |-> TRUE]])[(IF [x \in 1..2 |-> x] THEN 0 ELSE [a |-> 1, b |-> TRUE] + IF FALSE THEN 2147483647 ELSE 0)]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 175 to line 14, col 180 of module random_01097 and -.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 182.
    | Expression starting at line 14, column 175.
    | ExtendableExpr starting at line 14, column 174.
    | Expression starting at line 14, column 174.
    | Except Spec starting at line 14, column 74.
    | Fatal errors while parsing TLA+ spec in file random_01097
    | In module random_01097
    | Could not parse module random_01097 from file random_01097.tla
    | *** Errors: 1
    | In module random_01097
    | Could not parse module random_01097 from file random_01097.tla
    3002:1 Parsing or semantic analysis failed.
---*)
