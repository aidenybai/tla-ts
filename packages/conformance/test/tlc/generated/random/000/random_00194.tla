(*---
description: Evaluates a random function expression, seed 262, number 194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b317 \in DOMAIN ((3 * -1) :> IF FALSE THEN SUBSET {1} ELSE 2) |-> ((Cardinality({1}) % (b317 % -1)) * ((b317 @@ (1 :> 2)))[Cardinality(2..1)])])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 37 to line 14, col 37 of module random_00194 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 35.
    | Expression starting at line 14, column 35.
    | ExtendableExpr starting at line 14, column 34.
    | Expression starting at line 14, column 34.
    | ExtendableExpr starting at line 14, column 33.
    | Fatal errors while parsing TLA+ spec in file random_00194
    | In module random_00194
    | Could not parse module random_00194 from file random_00194.tla
    | *** Errors: 1
    | In module random_00194
    | Could not parse module random_00194 from file random_00194.tla
    3002:1 Parsing or semantic analysis failed.
---*)
