(*---
description: Evaluates a random int expression, seed 262, number 2791.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02791 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4417 \in {(-1 + 2) : b4418 \in ({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1})} : ({b4419 : b4419 \in {x \in 1..3 : x > 1}} \subseteq {b4417, [x \in 1..2 |-> x]})) - IF ((\A b4420 \in {} : FALSE) => ({x \in 1..3 : x > 1} \in {1, 2})) THEN ([[x \in 1..2 |-> x] EXCEPT ![0] = 0])[CASE FALSE -> 0 [] OTHER -> -1] ELSE (LET b4421 == -1 IN b4421 - (1 * -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 373 to line 14, col 373 of module random_02791 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 371.
    | Expression starting at line 14, column 371.
    | ExtendableExpr starting at line 14, column 370.
    | ExtendableExpr starting at line 14, column 362.
    | Expression starting at line 14, column 362.
    | Fatal errors while parsing TLA+ spec in file random_02791
    | In module random_02791
    | Could not parse module random_02791 from file random_02791.tla
    | *** Errors: 1
    | In module random_02791
    | Could not parse module random_02791 from file random_02791.tla
    3002:1 Parsing or semantic analysis failed.
---*)
