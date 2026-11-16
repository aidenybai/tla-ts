(*---
description: Evaluates a random bool expression, seed 262, number 4497.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04497 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-IF FALSE THEN 7 ELSE -1), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]).a} \subseteq ([[a |-> -1, b |-> TRUE] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] .. IF (2147483647 < 0) THEN ([a |-> 1]).a ELSE (-1 * -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 221 to line 14, col 221 of module random_04497 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 219.
    | Expression starting at line 14, column 218.
    | ExtendableExpr starting at line 14, column 217.
    | Expression starting at line 14, column 217.
    | IF THEN ELSE starting at line 14, column 173.
    | Fatal errors while parsing TLA+ spec in file random_04497
    | In module random_04497
    | Could not parse module random_04497 from file random_04497.tla
    | *** Errors: 1
    | In module random_04497
    | Could not parse module random_04497 from file random_04497.tla
    3002:1 Parsing or semantic analysis failed.
---*)
