(*---
description: Evaluates a random bool expression, seed 262, number 6788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 2, b |-> FALSE] EXCEPT !.a = @ + (7 * 7)] EXCEPT !.a = @ + IF (TRUE \/ TRUE) THEN (3 * -1) ELSE (7 % 2147483647)] = (CHOOSE r \in [a : 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 111 to line 14, col 111 of module random_06788 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 109.
    | Expression starting at line 14, column 109.
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | IF THEN ELSE starting at line 14, column 85.
    | Fatal errors while parsing TLA+ spec in file random_06788
    | In module random_06788
    | Could not parse module random_06788 from file random_06788.tla
    | *** Errors: 1
    | In module random_06788
    | Could not parse module random_06788 from file random_06788.tla
    3002:1 Parsing or semantic analysis failed.
---*)
