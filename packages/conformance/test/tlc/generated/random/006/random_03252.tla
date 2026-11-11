(*---
description: Evaluates a random int expression, seed 262, number 3252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((~(\A b5172 \in {2, 1, 3} : TRUE)) <=> (({1} \ 2..1) = ({} \ 1))) -> (IF ({1, 2} = 0) THEN Cardinality({1, 2}) ELSE (3 * -1) - ((--1) + (7 \div 3))) [] OTHER -> (Cardinality(DOMAIN <<5, 6>>) % (-(3 + 7))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 141 to line 14, col 141 of module random_03252 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 139.
    | Expression starting at line 14, column 139.
    | ExtendableExpr starting at line 14, column 138.
    | Expression starting at line 14, column 138.
    | IF THEN ELSE starting at line 14, column 92.
    | Fatal errors while parsing TLA+ spec in file random_03252
    | In module random_03252
    | Could not parse module random_03252 from file random_03252.tla
    | *** Errors: 1
    | In module random_03252
    | Could not parse module random_03252 from file random_03252.tla
    3002:1 Parsing or semantic analysis failed.
---*)
