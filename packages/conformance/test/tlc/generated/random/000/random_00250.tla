(*---
description: Evaluates a random set expression, seed 262, number 250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b414 \in {(b415 + b415) : b415 \in {7 : b416 \in Nat}} : IF (1 = 1) THEN ([a |-> 1, b |-> TRUE]).a ELSE (b414 - 7)) .. (((7 * -1) :> (3 + -1)))[((1 % 0) - ([x \in Nat |-> x + 1])[0])]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 149 to line 14, col 149 of module random_00250 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 147.
    | Expression starting at line 14, column 147.
    | ExtendableExpr starting at line 14, column 146.
    | Expression starting at line 14, column 146.
    | ExtendableExpr starting at line 14, column 145.
    | Fatal errors while parsing TLA+ spec in file random_00250
    | In module random_00250
    | Could not parse module random_00250 from file random_00250.tla
    | *** Errors: 1
    | In module random_00250
    | Could not parse module random_00250 from file random_00250.tla
    3002:1 Parsing or semantic analysis failed.
---*)
