(*---
description: Evaluates a random bool expression, seed 262, number 8371.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08371 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b12950 \in DOMAIN [x \in 1..2 |-> x] : ([a |-> 1] \subseteq (1 :> 2))) <=> ((2 * 0) \in (2147483647 .. 7))) => ([a |-> CASE TRUE -> TRUE [] OTHER -> -1, b |-> (FALSE \/ FALSE)] = [a |-> (2147483647 * -1), b |-> (2147483647 \in {x \in 1..3 : x > 1})])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 220 to line 14, col 220 of module random_08371 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 209.
    | Expression starting at line 14, column 209.
    | ExtendableExpr starting at line 14, column 208.
    | Expression starting at line 14, column 208.
    | Field Value starting at line 14, column 202.
    | Fatal errors while parsing TLA+ spec in file random_08371
    | In module random_08371
    | Could not parse module random_08371 from file random_08371.tla
    | *** Errors: 1
    | In module random_08371
    | Could not parse module random_08371 from file random_08371.tla
    3002:1 Parsing or semantic analysis failed.
---*)
