(*---
description: Evaluates a random bool expression, seed 262, number 6283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> {<<0, -1>>, (SUBSET {1} * -1)}, b |-> ((2..1 = {2, 1, 3}) /\ (2 < 2147483647))] = [a |-> ((3 % 3) + CASE FALSE -> -1 [] OTHER -> 2147483647), b |-> (([a |-> 1, b |-> TRUE]).a \in UNION {{1, 2}, {1}})]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 37 to line 14, col 42 of module random_06283 and *.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 44.
    | Expression starting at line 14, column 37.
    | ExtendableExpr starting at line 14, column 36.
    | Expression starting at line 14, column 36.
    | Some { } form starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_06283
    | In module random_06283
    | Could not parse module random_06283 from file random_06283.tla
    | *** Errors: 1
    | In module random_06283
    | Could not parse module random_06283 from file random_06283.tla
    3002:1 Parsing or semantic analysis failed.
---*)
