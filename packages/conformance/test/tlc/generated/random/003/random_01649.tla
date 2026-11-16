(*---
description: Evaluates a random bool expression, seed 262, number 1649.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01649 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 - 2) \ (SUBSET {1} \ 1..3)) \subseteq ((FALSE * -1) .. CASE FALSE -> 7 [] OTHER -> 2)) /\ (~((2147483647 % -1) < (--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 68 to line 14, col 68 of module random_01649 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 62.
    | Expression starting at line 14, column 62.
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | ExtendableExpr starting at line 14, column 60.
    | Fatal errors while parsing TLA+ spec in file random_01649
    | In module random_01649
    | Could not parse module random_01649 from file random_01649.tla
    | *** Errors: 1
    | In module random_01649
    | Could not parse module random_01649 from file random_01649.tla
    3002:1 Parsing or semantic analysis failed.
---*)
