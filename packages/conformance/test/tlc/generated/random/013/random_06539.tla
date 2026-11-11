(*---
description: Evaluates a random int expression, seed 262, number 6539.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06539 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(<<2, -1>>, LAMBDA p, q : p < q) \ {b10052 \in DOMAIN [x \in Nat |-> x + 1] : (Nat \subseteq 2..1)}) + CASE (~(FALSE <=> TRUE)) -> IF CASE TRUE -> 2 [] OTHER -> 7 THEN LET b10053 == 3 IN b10053 ELSE Cardinality(Nat) [] OTHER -> ((--1) - CASE TRUE -> -1 [] OTHER -> 0)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 257 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 254.
    | Expression starting at line 14, column 254.
    | ExtendableExpr starting at line 14, column 253.
    | Expression starting at line 14, column 253.
    | Case Other Arm starting at line 14, column 244.
    | Fatal errors while parsing TLA+ spec in file random_06539
    | In module random_06539
    | Could not parse module random_06539 from file random_06539.tla
    | *** Errors: 1
    | In module random_06539
    | Could not parse module random_06539 from file random_06539.tla
    3002:1 Parsing or semantic analysis failed.
---*)
