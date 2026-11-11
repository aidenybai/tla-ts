(*---
description: Evaluates a random function expression, seed 262, number 1874.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01874 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (TRUE <=> FALSE) -> (<<5, 6>>)[2147483647] [] OTHER -> LET b2950 == 7 IN 3 :> ([a |-> 3, b |-> FALSE]).a) @@ [[b2951 \in DOMAIN [x \in Nat |-> x + 1] |-> (-2147483647)] EXCEPT ![(CHOOSE b2952 \in {TRUE : b2953 \in {}} : (FALSE <=> TRUE))] = ((1 - 0) \div (2 * -1))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 281 to line 14, col 281 of module random_01874 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 279.
    | Expression starting at line 14, column 279.
    | ExtendableExpr starting at line 14, column 278.
    | ExtendableExpr starting at line 14, column 265.
    | Expression starting at line 14, column 265.
    | Fatal errors while parsing TLA+ spec in file random_01874
    | In module random_01874
    | Could not parse module random_01874 from file random_01874.tla
    | *** Errors: 1
    | In module random_01874
    | Could not parse module random_01874 from file random_01874.tla
    3002:1 Parsing or semantic analysis failed.
---*)
