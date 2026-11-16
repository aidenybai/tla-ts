(*---
description: Evaluates a random bool expression, seed 262, number 9578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ((2147483647 * -1) \div (7 + -1)), b |-> ((FALSE <=> TRUE) <=> ([a |-> 1, b |-> TRUE] = <<1>>))] = [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + ([[a |-> 1] EXCEPT !.a = @ + 1]).a]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 37 to line 14, col 37 of module random_09578 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 26.
    | Expression starting at line 14, column 26.
    | ExtendableExpr starting at line 14, column 25.
    | Expression starting at line 14, column 25.
    | ExtendableExpr starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_09578
    | In module random_09578
    | Could not parse module random_09578 from file random_09578.tla
    | *** Errors: 1
    | In module random_09578
    | Could not parse module random_09578 from file random_09578.tla
    3002:1 Parsing or semantic analysis failed.
---*)
